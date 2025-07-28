import { Effect, Context, Layer, Data } from "effect";
import * as Zod from "zod";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { schema } from "../schema";
import { Database } from "./db.service";
import { DbError, ValidationError } from "../errors";
import {
  type SelectJob,
  type InsertJobData,
  type UpdateJobData,
  selectJobSchema,
  insertJobSchema,
  updateJobSchema,
} from "../schema/jobs";
import {
  type SelectPipelineStep,
  type InsertPipelineStepData,
  type UpdatePipelineStepData,
  selectPipelineStepSchema,
  insertPipelineStepSchema,
  updatePipelineStepSchema,
} from "../schema/pipeline-steps";

export class JobNotFoundError extends Data.TaggedError("JobNotFoundError")<{
  readonly jobId: string;
}> {}

export class PipelineStepNotFoundError extends Data.TaggedError(
  "PipelineStepNotFoundError"
)<{
  readonly stepId: string;
  readonly jobId?: string;
}> {}

const validateData = <A>(
  zodSchema: Zod.ZodSchema<A>,
  data: unknown
): Effect.Effect<A, ValidationError> =>
  Effect.try({
    try: () => {
      const result = zodSchema.parse(data);
      return result;
    },
    catch: (error) => {
      console.log('Validation failed - Raw Zod error:', error);
      const zodError = error as Zod.ZodError;
      console.log('Zod error details:', {
        name: zodError.name,
        message: zodError.message,
        issues: zodError.issues
      });
      
      const validationError = new ValidationError({
        errors: zodError,
        message: "Validation failed",
      });
      
      console.log('Created ValidationError:', {
        validationError,
        errorType: validationError.constructor.name,
        tag: validationError._tag,
        errors: validationError.errors,
        message: validationError.message
      });
      
      return validationError;
    },
  });

const requireRecord = <T, E>(
  record: T | undefined,
  notFoundError: E
): Effect.Effect<T, E> =>
  record ? Effect.succeed(record) : Effect.fail(notFoundError);

const requireNonEmptyArray = <T, E>(
  records: T[],
  notFoundError: E
): Effect.Effect<void, E> =>
  records.length > 0 ? Effect.void : Effect.fail(notFoundError);

export interface JobService {
  readonly getJobById: (
    id: string
  ) => Effect.Effect<SelectJob, JobNotFoundError | DbError>;
  readonly getJobs: () => Effect.Effect<Array<SelectJob>, DbError>;
  readonly createJob: (
    data: InsertJobData
  ) => Effect.Effect<SelectJob, ValidationError | DbError>;
  readonly updateJob: (
    id: string,
    data: UpdateJobData
  ) => Effect.Effect<
    SelectJob,
    JobNotFoundError | ValidationError | DbError
  >;
  readonly deleteJob: (
    id: string
  ) => Effect.Effect<void, JobNotFoundError | DbError>;
  readonly retryJob: (
    id: string
  ) => Effect.Effect<void, JobNotFoundError | DbError>;
  readonly getStepById: (
    id: string
  ) => Effect.Effect<
    SelectPipelineStep,
    PipelineStepNotFoundError | DbError
  >;
  readonly getStepsForJob: (
    jobId: string
  ) => Effect.Effect<Array<SelectPipelineStep>, DbError>;
  readonly createPipelineStep: (
    data: InsertPipelineStepData
  ) => Effect.Effect<SelectPipelineStep, ValidationError | DbError>;
  readonly updatePipelineStep: (
    id: string,
    data: UpdatePipelineStepData
  ) => Effect.Effect<
    SelectPipelineStep,
    PipelineStepNotFoundError | ValidationError | DbError
  >;
  readonly retryPipelineStep: (
    id: string
  ) => Effect.Effect<void, PipelineStepNotFoundError | DbError>;
}

export const JobService = Context.GenericTag<JobService>("JobService");

export const JobServiceLive = Layer.effect(
  JobService,
  Effect.gen(function* () {
    const { db } = yield* Database;

    const getJobById = (id: string): Effect.Effect<SelectJob, JobNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () => db.query.jobs.findFirst({ where: eq(schema.jobs.id, id) }),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to get job by id" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new JobNotFoundError({ jobId: id }))
        ),
        Effect.flatMap((job) =>
          validateData(selectJobSchema, job).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid job data in database",
                })
            )
          )
        )
      );

    const getJobs = (): Effect.Effect<Array<SelectJob>, DbError> =>
      Effect.tryPromise({
        try: () => db.query.jobs.findMany(),
        catch: (cause) => new DbError({ cause, message: "Failed to get jobs" }),
      }).pipe(
        Effect.flatMap((jobs) =>
          validateData(Zod.array(selectJobSchema), jobs).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid jobs data in database",
                })
            )
          )
        )
      );

    const createJob = (data: InsertJobData): Effect.Effect<SelectJob, ValidationError | DbError> =>
      validateData(insertJobSchema, data).pipe(
        Effect.flatMap((validatedData) => {
          const newJob = {
            ...validatedData,
            id: randomUUID(),
            status: validatedData.status || 'pending'
          };
          
          return Effect.tryPromise({
            try: () =>
              db.insert(schema.jobs).values(newJob).returning(),
            catch: (cause) =>
              new DbError({ cause, message: "Failed to create job" }),
          });
        }),
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create job",
            })
          )
        ),
        Effect.flatMap((newJob) =>
          validateData(selectJobSchema, newJob).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid created job data",
                })
            )
          )
        )
      );

    const updateJob = (
      id: string,
      data: UpdateJobData
    ): Effect.Effect<SelectJob, JobNotFoundError | ValidationError | DbError> =>
      validateData(updateJobSchema, data).pipe(
        Effect.flatMap((validatedData) =>
          Effect.tryPromise({
            try: () =>
              db
                .update(schema.jobs)
                .set({ ...validatedData, updatedAt: new Date() })
                .where(eq(schema.jobs.id, id))
                .returning(),
            catch: (cause) =>
              new DbError({ cause, message: "Failed to update job" }),
          })
        ),
        Effect.flatMap((result) =>
          requireRecord(result[0], new JobNotFoundError({ jobId: id }))
        ),
        Effect.flatMap((updatedJob) =>
          validateData(selectJobSchema, updatedJob).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid updated job data",
                })
            )
          )
        )
      );

    const deleteJob = (id: string): Effect.Effect<void, JobNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db.delete(schema.jobs).where(eq(schema.jobs.id, id)).returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to delete job" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new JobNotFoundError({ jobId: id }))
        )
      );

    const getStepById = (id: string): Effect.Effect<SelectPipelineStep, PipelineStepNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.pipelineSteps.findFirst({
            where: eq(schema.pipelineSteps.id, id),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get pipeline step by id",
          }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new PipelineStepNotFoundError({ stepId: id }))
        ),
        Effect.flatMap((step) =>
          validateData(selectPipelineStepSchema, step).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid pipeline step data in database",
                })
            )
          )
        )
      );

    const getStepsForJob = (jobId: string): Effect.Effect<Array<SelectPipelineStep>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.pipelineSteps.findMany({
            where: eq(schema.pipelineSteps.jobId, jobId),
            orderBy: (steps, { asc }) => asc(steps.startedAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get pipeline steps for job",
          }),
      }).pipe(
        Effect.flatMap((steps) =>
          validateData(Zod.array(selectPipelineStepSchema), steps).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid pipeline steps data in database",
                })
            )
          )
        )
      );

    const createPipelineStep = (data: InsertPipelineStepData): Effect.Effect<SelectPipelineStep, ValidationError | DbError> =>
      validateData(insertPipelineStepSchema, data).pipe(
        Effect.flatMap((validatedData) =>
          Effect.tryPromise({
            try: () =>
              db
                .insert(schema.pipelineSteps)
                .values(validatedData)
                .returning(),
            catch: (cause) =>
              new DbError({
                cause,
                message: "Failed to create pipeline step",
              }),
          })
        ),
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create pipeline step",
            })
          )
        ),
        Effect.flatMap((newStep) =>
          validateData(selectPipelineStepSchema, newStep).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid created pipeline step data",
                })
            )
          )
        )
      );

    const updatePipelineStep = (
      id: string,
      data: UpdatePipelineStepData
    ): Effect.Effect<SelectPipelineStep, PipelineStepNotFoundError | ValidationError | DbError> =>
      validateData(updatePipelineStepSchema, data).pipe(
        Effect.flatMap((validatedData) =>
          Effect.tryPromise({
            try: () =>
              db
                .update(schema.pipelineSteps)
                .set(validatedData)
                .where(eq(schema.pipelineSteps.id, id))
                .returning(),
            catch: (cause) =>
              new DbError({
                cause,
                message: "Failed to update pipeline step",
              }),
          })
        ),
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new PipelineStepNotFoundError({ stepId: id })
          )
        ),
        Effect.flatMap((updatedStep) =>
          validateData(selectPipelineStepSchema, updatedStep).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid updated pipeline step data",
                })
            )
          )
        )
      );

    const retryJob = (id: string): Effect.Effect<void, JobNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.jobs)
            .set({ status: 'pending', updatedAt: new Date() })
            .where(eq(schema.jobs.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to retry job" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new JobNotFoundError({ jobId: id }))
        )
      );

    const retryPipelineStep = (id: string): Effect.Effect<void, PipelineStepNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.pipelineSteps)
            .set({ 
              status: 'pending', 
              error: null,
              output: null,
              completedAt: null
            })
            .where(eq(schema.pipelineSteps.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to retry pipeline step" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new PipelineStepNotFoundError({ stepId: id }))
        )
      );

    return {
      getJobById,
      getJobs,
      createJob,
      updateJob,
      deleteJob,
      retryJob,
      getStepById,
      getStepsForJob,
      createPipelineStep,
      updatePipelineStep,
      retryPipelineStep,
    };
  })
);
