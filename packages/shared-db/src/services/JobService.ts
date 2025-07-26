import { Effect, Context } from "effect";
import * as Pg from "@effect/sql-drizzle/Pg";
import { PgClientError } from "@effect/sql/PgClient";
import * as Zod from "zod";

import {
  type DB,
  schema,
  type SelectJob,
  type InsertJobData,
  type UpdateJobData,
  selectJobSchema,
  insertJobSchema,
  updateJobSchema,
  type SelectPipelineStep,
  type InsertPipelineStepData,
  type UpdatePipelineStepData,
  selectPipelineStepSchema,
  insertPipelineStepSchema,
  updatePipelineStepSchema,
} from "../schema";

import { withDbOperation } from "../utils";

export class ValidationError extends Context.Tag("ValidationError")<
  ValidationError,
  {
    readonly _tag: "ValidationError";
    readonly errors: Zod.ZodError;
    readonly message: string;
  }
>() {}

export class JobNotFoundError extends Context.Tag("JobNotFoundError")<
  JobNotFoundError,
  {
    readonly _tag: "JobNotFoundError";
    readonly jobId: string;
  }
>() {}

export class PipelineStepNotFoundError extends Context.Tag("PipelineStepNotFoundError")<
  PipelineStepNotFoundError,
  {
    readonly _tag: "PipelineStepNotFoundError";
    readonly stepId: string;
    readonly jobId?: string;
  }
>() {}

const parseZod = <Input, Output>(
  schema: Zod.ZodSchema<Output, Zod.ZodTypeDef, Input>,
  data: Input,
) =>
  Effect.try({
    try: () => schema.parse(data),
    catch: (error) => new ValidationError({ errors: error as Zod.ZodError, message: "Validation failed" }),
  });

export class JobService extends Context.Tag("JobService")<
  JobService,
  {
    readonly getJobById: (
      id: string,
    ) => Effect.Effect<SelectJob, JobNotFoundError | PgClientError, never>;
    readonly getJobs: () => Effect.Effect<Array<SelectJob>, PgClientError, never>;
    readonly createJob: (
      data: InsertJobData,
    ) => Effect.Effect<SelectJob, PgClientError | ValidationError, never>;
    readonly updateJob: (
      id: string,
      data: UpdateJobData,
    ) => Effect.Effect<SelectJob, JobNotFoundError | PgClientError | ValidationError, never>;
    readonly deleteJob: (
      id: string,
    ) => Effect.Effect<void, JobNotFoundError | PgClientError, never>;

    readonly getStepById: (
      id: string,
    ) => Effect.Effect<SelectPipelineStep, PipelineStepNotFoundError | PgClientError, never>;
    readonly getStepsForJob: (
      jobId: string,
    ) => Effect.Effect<Array<SelectPipelineStep>, PgClientError, never>;
    readonly createPipelineStep: (
      data: InsertPipelineStepData,
    ) => Effect.Effect<SelectPipelineStep, PgClientError | ValidationError, never>;
    readonly updatePipelineStep: (
      id: string,
      data: UpdatePipelineStepData,
    ) => Effect.Effect<
      SelectPipelineStep,
      PipelineStepNotFoundError | PgClientError | ValidationError,
      never
    >;
  }
>() {}

export const JobServiceLive = Effect.serviceConstants(JobService, {
  getJobById: (id: string) =>
    withDbOperation(
      Effect.gen(function* () {
        const db = yield* Pg.drizzle<DB>();
        const result = yield* Effect.promise(() =>
          db.query.jobs.findFirst({ where: (jobs, { eq }) => eq(jobs.id, id) }),
        );
        if (!result) {
          yield* Effect.fail(new JobNotFoundError({ jobId: id }));
        }
        return yield* parseZod(selectJobSchema, result);
      }),
      "getJobById",
    ),

  getJobs: () =>
    withDbOperation(
      Effect.gen(function* () {
        const db = yield* Pg.drizzle<DB>();
        const jobs = yield* Effect.promise(() => db.query.jobs.findMany());
        return yield* parseZod(selectJobSchema.array(), jobs);
      }),
      "getJobs",
    ),

  createJob: (data: InsertJobData) =>
    withDbOperation(
      Effect.gen(function* () {
        const validatedData = yield* parseZod(insertJobSchema, data);
        const db = yield* Pg.drizzle<DB>();
        const [newJob] = yield* Effect.promise(() =>
          db.insert(schema.jobs).values(validatedData).returning(),
        );
        if (!newJob) {
          yield* Effect.die("Failed to create job");
        }
        return yield* parseZod(selectJobSchema, newJob);
      }),
      "createJob",
    ),

  updateJob: (id: string, data: UpdateJobData) =>
    withDbOperation(
      Effect.gen(function* () {
        const validatedData = yield* parseZod(updateJobSchema, { ...data, id });
        const db = yield* Pg.drizzle<DB>();
        const [updatedJob] = yield* Effect.promise(() =>
          db.update(schema.jobs)
            .set({ ...validatedData, updatedAt: new Date() })
            .where((jobs, { eq }) => eq(jobs.id, id))
            .returning(),
        );
        if (!updatedJob) {
          yield* Effect.fail(new JobNotFoundError({ jobId: id }));
        }
        return yield* parseZod(selectJobSchema, updatedJob);
      }),
      "updateJob",
    ),

  deleteJob: (id: string) =>
    withDbOperation(
      Effect.gen(function* () {
        const db = yield* Pg.drizzle<DB>();
        const deletedRows = yield* Effect.promise(() =>
          db.delete(schema.jobs).where((jobs, { eq }) => eq(jobs.id, id)),
        );
        if (deletedRows.count === 0) {
          yield* Effect.fail(new JobNotFoundError({ jobId: id }));
        }
        yield* Effect.succeed(void 0);
      }),
      "deleteJob",
    ),

  getStepById: (id: string) =>
    withDbOperation(
      Effect.gen(function* () {
        const db = yield* Pg.drizzle<DB>();
        const result = yield* Effect.promise(() =>
          db.query.pipelineSteps.findFirst({ where: (steps, { eq }) => eq(steps.id, id) }),
        );
        if (!result) {
          yield* Effect.fail(new PipelineStepNotFoundError({ stepId: id }));
        }
        return yield* parseZod(selectPipelineStepSchema, result);
      }),
      "getStepById",
    ),

  getStepsForJob: (jobId: string) =>
    withDbOperation(
      Effect.gen(function* () {
        const db = yield* Pg.drizzle<DB>();
        const steps = yield* Effect.promise(() =>
          db.query.pipelineSteps.findMany({
            where: (steps, { eq }) => eq(steps.jobId, jobId),
            orderBy: (steps, { asc }) => asc(steps.startedAt),
          }),
        );
        return yield* parseZod(selectPipelineStepSchema.array(), steps);
      }),
      "getStepsForJob",
    ),

  createPipelineStep: (data: InsertPipelineStepData) =>
    withDbOperation(
      Effect.gen(function* () {
        const validatedData = yield* parseZod(insertPipelineStepSchema, data);
        const db = yield* Pg.drizzle<DB>();
        const [newStep] = yield* Effect.promise(() =>
          db.insert(schema.pipelineSteps).values(validatedData).returning(),
        );
        if (!newStep) {
          yield* Effect.die("Failed to create pipeline step");
        }
        return yield* parseZod(selectPipelineStepSchema, newStep);
      }),
      "createPipelineStep",
    ),

  updatePipelineStep: (id: string, data: UpdatePipelineStepData) =>
    withDbOperation(
      Effect.gen(function* () {
        const validatedData = yield* parseZod(updatePipelineStepSchema, { ...data, id });
        const db = yield* Pg.drizzle<DB>();
        const [updatedStep] = yield* Effect.promise(() =>
          db.update(schema.pipelineSteps)
            .set(validatedData)
            .where((steps, { eq }) => eq(steps.id, id))
            .returning(),
        );
        if (!updatedStep) {
          yield* Effect.fail(new PipelineStepNotFoundError({ stepId: id }));
        }
        return yield* parseZod(selectPipelineStepSchema, updatedStep);
      }),
      "updatePipelineStep",
    ),
});
