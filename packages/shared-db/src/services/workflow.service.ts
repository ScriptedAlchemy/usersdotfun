import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";

import { DbError } from "../errors";
import { schema, type NewPipelineStep, type NewSourceItem, type NewWorkflow, type NewWorkflowRun, type PipelineStep, type SourceItem, type Workflow, type WorkflowRun, type User } from "../schema";
import { Database } from "./db.service";

export class WorkflowNotFoundError extends Data.TaggedError("WorkflowNotFoundError")<{
  readonly workflowId: string;
}> { }

export class WorkflowRunNotFoundError extends Data.TaggedError("WorkflowRunNotFoundError")<{
  readonly runId: string;
}> { }

export class PipelineStepNotFoundError extends Data.TaggedError(
  "PipelineStepNotFoundError"
)<{
  readonly stepId: string;
  readonly runId?: string;
}> { }

export class SourceItemNotFoundError extends Data.TaggedError("SourceItemNotFoundError")<{
  readonly itemId: string;
}> { }

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

export interface CreateWorkflowData extends Omit<NewWorkflow, 'id' | 'createdAt' | 'updatedAt'> { }

export interface UpdateWorkflowData extends Partial<Omit<NewWorkflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>> { }

export interface CreateWorkflowRunData extends Omit<NewWorkflowRun, 'id' | 'startedAt' | 'itemsProcessed' | 'itemsTotal'> { }

export interface UpdateWorkflowRunData extends Partial<Omit<NewWorkflowRun, 'id' | 'workflowId' | 'startedAt'>> { }

export interface CreateSourceItemData extends Omit<NewSourceItem, 'id' | 'createdAt'> { }

export interface CreatePipelineStepData extends Omit<NewPipelineStep, 'id'> { }

export interface UpdatePipelineStepData extends Partial<Omit<NewPipelineStep, 'id' | 'runId'>> { }

export interface WorkflowService {
  // Workflow methods
  readonly createWorkflow: (
    data: CreateWorkflowData
  ) => Effect.Effect<Workflow, DbError>;
  readonly getWorkflowById: (
    id: string
  ) => Effect.Effect<Workflow & { user: User; runs: WorkflowRun[]; items: SourceItem[] }, WorkflowNotFoundError | DbError>;
  readonly getWorkflows: () => Effect.Effect<Array<Workflow & { user: User }>, DbError>;
  readonly updateWorkflow: (
    id: string,
    data: UpdateWorkflowData
  ) => Effect.Effect<Workflow, WorkflowNotFoundError | DbError>;
  readonly deleteWorkflow: (
    id: string
  ) => Effect.Effect<void, WorkflowNotFoundError | DbError>;

  // Workflow run methods
  readonly createWorkflowRun: (
    data: CreateWorkflowRunData
  ) => Effect.Effect<WorkflowRun, DbError>;
  readonly getRunsForWorkflow: (
    workflowId: string
  ) => Effect.Effect<Array<WorkflowRun & { triggeredBy: User | null }>, DbError>;
  readonly updateWorkflowRun: (
    id: string,
    data: UpdateWorkflowRunData
  ) => Effect.Effect<WorkflowRun, WorkflowRunNotFoundError | DbError>;

  // Source item methods
  readonly upsertSourceItem: (
    data: CreateSourceItemData
  ) => Effect.Effect<SourceItem, DbError>;
  readonly getItemsForWorkflow: (
    workflowId: string
  ) => Effect.Effect<Array<SourceItem>, DbError>;

  // Pipeline step methods (for historical record)
  readonly createPipelineStep: (
    data: CreatePipelineStepData
  ) => Effect.Effect<PipelineStep, DbError>;
  readonly updatePipelineStep: (
    id: string,
    data: UpdatePipelineStepData
  ) => Effect.Effect<PipelineStep, PipelineStepNotFoundError | DbError>;
  readonly getStepsForRun: (
    runId: string
  ) => Effect.Effect<Array<PipelineStep>, DbError>;
}

export const WorkflowService = Context.GenericTag<WorkflowService>("WorkflowService");

export const WorkflowServiceLive = Layer.effect(
  WorkflowService,
  Effect.gen(function* () {
    const { db } = yield* Database;

    // Workflow methods
    const createWorkflow = (data: CreateWorkflowData): Effect.Effect<Workflow, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newWorkflow = {
            ...data,
            id: randomUUID(),
          };
          return db.insert(schema.workflow).values(newWorkflow).returning();
        },
        catch: (cause) =>
          new DbError({ cause, message: "Failed to create workflow" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create workflow",
            })
          )
        )
      );

    const getWorkflowById = (id: string): Effect.Effect<Workflow & { user: User; runs: WorkflowRun[]; items: SourceItem[] }, WorkflowNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () => db.query.workflow.findFirst({
          where: eq(schema.workflow.id, id),
          with: {
            user: true,
            runs: true,
            items: true,
          }
        }),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to get workflow by id" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new WorkflowNotFoundError({ workflowId: id }))
        )
      );

    const getWorkflows = (): Effect.Effect<Array<Workflow & { user: User }>, DbError> =>
      Effect.tryPromise({
        try: () => db.query.workflow.findMany({
          with: {
            user: true,
          }
        }),
        catch: (cause) => new DbError({ cause, message: "Failed to get workflows" }),
      });

    const updateWorkflow = (
      id: string,
      data: UpdateWorkflowData
    ): Effect.Effect<Workflow, WorkflowNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.workflow)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.workflow.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to update workflow" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result[0], new WorkflowNotFoundError({ workflowId: id }))
        )
      );

    const deleteWorkflow = (id: string): Effect.Effect<void, WorkflowNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db.delete(schema.workflow).where(eq(schema.workflow.id, id)).returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to delete workflow" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new WorkflowNotFoundError({ workflowId: id }))
        )
      );

    // Workflow run methods
    const createWorkflowRun = (data: CreateWorkflowRunData): Effect.Effect<WorkflowRun, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newRun = {
            ...data,
            id: randomUUID(),
          };
          return db.insert(schema.workflowRun).values(newRun).returning();
        },
        catch: (cause) =>
          new DbError({ cause, message: "Failed to create workflow run" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create workflow run",
            })
          )
        )
      );

    const getRunsForWorkflow = (workflowId: string): Effect.Effect<Array<WorkflowRun & { triggeredBy: User | null }>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.workflowRun.findMany({
            where: eq(schema.workflowRun.workflowId, workflowId),
            with: {
              triggeredBy: true,
            },
            orderBy: (runs, { desc }) => desc(runs.startedAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get runs for workflow",
          }),
      });

    const updateWorkflowRun = (
      id: string,
      data: UpdateWorkflowRunData
    ): Effect.Effect<WorkflowRun, WorkflowRunNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.workflowRun)
            .set(data)
            .where(eq(schema.workflowRun.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to update workflow run" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result[0], new WorkflowRunNotFoundError({ runId: id }))
        )
      );

    // Source item methods
    const upsertSourceItem = (data: CreateSourceItemData): Effect.Effect<SourceItem, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newItem = {
            ...data,
            id: randomUUID(),
          };
          return db.insert(schema.sourceItem).values(newItem).returning();
        },
        catch: (cause) =>
          new DbError({ cause, message: "Failed to upsert source item" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to upsert source item",
            })
          )
        )
      );

    const getItemsForWorkflow = (workflowId: string): Effect.Effect<Array<SourceItem>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.sourceItem.findMany({
            where: eq(schema.sourceItem.workflowId, workflowId),
            orderBy: (items, { desc }) => desc(items.createdAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get items for workflow",
          }),
      });

    // Pipeline step methods
    const createPipelineStep = (data: CreatePipelineStepData): Effect.Effect<PipelineStep, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newStep = {
            ...data,
            id: randomUUID(),
          };
          return db.insert(schema.pipelineStep).values(newStep).returning();
        },
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to create pipeline step",
          }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create pipeline step",
            })
          )
        )
      );

    const updatePipelineStep = (
      id: string,
      data: UpdatePipelineStepData
    ): Effect.Effect<PipelineStep, PipelineStepNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.pipelineStep)
            .set(data)
            .where(eq(schema.pipelineStep.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to update pipeline step",
          }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new PipelineStepNotFoundError({ stepId: id })
          )
        )
      );

    const getStepsForRun = (runId: string): Effect.Effect<Array<PipelineStep>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.pipelineStep.findMany({
            where: eq(schema.pipelineStep.runId, runId),
            orderBy: (steps, { asc }) => asc(steps.startedAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get pipeline steps for run",
          }),
      });

    return {
      createWorkflow,
      getWorkflowById,
      getWorkflows,
      updateWorkflow,
      deleteWorkflow,
      createWorkflowRun,
      getRunsForWorkflow,
      updateWorkflowRun,
      upsertSourceItem,
      getItemsForWorkflow,
      createPipelineStep,
      updatePipelineStep,
      getStepsForRun,
    };
  })
);
