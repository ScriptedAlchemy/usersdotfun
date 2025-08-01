import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";

import { DbError } from "../errors";
import { schema, type NewPluginRun, type NewSourceItem, type NewWorkflow, type NewWorkflowRun, type PluginRun, type SourceItem, type User, type Workflow, type WorkflowRun } from "../schema";
import { Database } from "./db.service";

export class WorkflowNotFoundError extends Data.TaggedError("WorkflowNotFoundError")<{
  readonly workflowId: string;
}> { }

export class WorkflowRunNotFoundError extends Data.TaggedError("WorkflowRunNotFoundError")<{
  readonly runId: string;
}> { }

export class PluginRunNotFoundError extends Data.TaggedError(
  "PluginRunNotFoundError"
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

export interface CreatePluginRunData extends Omit<NewPluginRun, 'id'> { }

export interface UpdatePluginRunData extends Partial<Omit<NewPluginRun, 'id' | 'runId'>> { }

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
  readonly getRunById: (
    runId: string
  ) => Effect.Effect<WorkflowRun, WorkflowRunNotFoundError | DbError>;
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
  readonly createPluginRun: (
    data: CreatePluginRunData
  ) => Effect.Effect<PluginRun, DbError>;
  readonly updatePluginRun: (
    id: string,
    data: UpdatePluginRunData
  ) => Effect.Effect<PluginRun, PluginRunNotFoundError | DbError>;
  readonly getPluginRunsForRun: (
    runId: string
  ) => Effect.Effect<Array<PluginRun>, DbError>;
  readonly getPluginRunByStep: (
    runId: string,
    itemId: string,
    stepId: string
  ) => Effect.Effect<PluginRun, DbError | SourceItemNotFoundError>;
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

    const getRunById = (runId: string): Effect.Effect<WorkflowRun, WorkflowRunNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () => db.query.workflowRun.findFirst({
          where: eq(schema.workflowRun.id, runId),
        }),
        catch: (cause) => new DbError({ cause, message: "Failed to get workflow run by id" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new WorkflowRunNotFoundError({ runId }))
        )
      );

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
          return db.insert(schema.sourceItem)
            .values(newItem)
            .onConflictDoUpdate({
              target: [schema.sourceItem.workflowId, schema.sourceItem.data],
              set: { processedAt: new Date() }
            })
            .returning();
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
    const createPluginRun = (data: CreatePluginRunData): Effect.Effect<PluginRun, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newStep = {
            ...data,
            id: randomUUID(),
          };
          return db.insert(schema.pluginRun).values(newStep).returning();
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

    const updatePluginRun = (
      id: string,
      data: UpdatePluginRunData
    ): Effect.Effect<PluginRun, PluginRunNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.pluginRun)
            .set(data)
            .where(eq(schema.pluginRun.id, id))
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
            new PluginRunNotFoundError({ stepId: id })
          )
        )
      );

    const getPluginRunsForRun = (runId: string): Effect.Effect<Array<PluginRun>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.pluginRun.findMany({
            where: eq(schema.pluginRun.workflowRunId, runId),
            orderBy: (steps, { asc }) => asc(steps.startedAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get plugin runs for run",
          }),
      });

    const getPluginRunByStep = (runId: string, itemId: string, stepId: string) =>
      Effect.tryPromise({
        try: () => db.query.pluginRun.findFirst({
          where: and(
            eq(schema.pluginRun.workflowRunId, runId),
            eq(schema.pluginRun.sourceItemId, itemId),
            eq(schema.pluginRun.stepId, stepId)
          )
        }),
        catch: (cause) => new DbError({ cause, message: "Failed to get plugin run by step" }),
      }).pipe(
        Effect.flatMap(result => requireRecord(result, new SourceItemNotFoundError({ itemId })))
      );

    return {
      createWorkflow,
      getWorkflowById,
      getWorkflows,
      updateWorkflow,
      deleteWorkflow,
      createWorkflowRun,
      getRunById,
      getRunsForWorkflow,
      updateWorkflowRun,
      upsertSourceItem,
      getItemsForWorkflow,
      createPluginRun,
      updatePluginRun,
      getPluginRunsForRun,
      getPluginRunByStep
    };
  })
);
