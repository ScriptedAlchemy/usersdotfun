import {
  pluginRunSchema,
  richWorkflowRunSchema,
  richWorkflowRunSummarySchema,
  richWorkflowSchema,
  richWorkflowSummarySchema,
  sourceItemSchema,
  workflowRunSchema,
  workflowSchema,
} from "@usersdotfun/shared-types/schemas";
import type {
  PluginRun,
  RichWorkflow,
  RichWorkflowRun,
  RichWorkflowRunSummary,
  RichWorkflowSummary,
  SourceItem,
  User,
  Workflow,
  WorkflowRun,
} from "@usersdotfun/shared-types/types";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";
import { DbError } from "../errors";
import { schema, type NewWorkflowEntity, type PluginRunEntity, type SourceItemEntity, type WorkflowEntity, type WorkflowRunEntity } from "../schema";
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

export interface CreateWorkflowData extends Omit<WorkflowEntity, 'id' | 'createdAt' | 'updatedAt'> { }

export interface UpdateWorkflowData extends Partial<Omit<CreateWorkflowData, 'createdBy'>> { }

export interface CreateWorkflowRunData extends Omit<WorkflowRunEntity, 'id' | 'startedAt' | 'itemsProcessed' | 'itemsTotal' | 'completedAt' | 'failureReason'> { }

export interface UpdateWorkflowRunData extends Partial<Pick<WorkflowRunEntity, 'status' | 'itemsProcessed' | 'itemsTotal' | 'completedAt' | 'failureReason'>> { }

export interface CreateSourceItemData extends Omit<SourceItemEntity, 'id' | 'createdAt'> { }

export interface CreatePluginRunData extends Omit<PluginRunEntity, 'id' | 'output' | 'error' | 'completedAt'> { }

export interface UpdatePluginRunData extends Partial<Pick<PluginRunEntity, 'status' | 'output' | 'error' | 'completedAt'>> { }

export interface WorkflowService {
  // Workflow methods
  readonly createWorkflow: (
    data: CreateWorkflowData
  ) => Effect.Effect<Workflow, DbError>;
  readonly getWorkflowById: (
    id: string
  ) => Effect.Effect<
    RichWorkflow,
    WorkflowNotFoundError | DbError
  >;
  readonly getWorkflows: () => Effect.Effect<RichWorkflowSummary[], DbError>;
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
  readonly getWorkflowRunById: (
    runId: string
  ) => Effect.Effect<RichWorkflowRun, WorkflowRunNotFoundError | DbError>;
  readonly getWorkflowRuns: (
    workflowId: string
  ) => Effect.Effect<Array<RichWorkflowRunSummary>, DbError>;
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
  ) => Effect.Effect<PluginRun, DbError | PluginRunNotFoundError>;
}

export const WorkflowService = Context.GenericTag<WorkflowService>("WorkflowService");

export const WorkflowServiceLive = Layer.effect(
  WorkflowService,
  Effect.gen(function* () {
    const { db } = yield* Database;

    // Generic helper to parse database entities to public types
    const parseEntity = <T>(entity: any, schema: any, entityType: string): Effect.Effect<T, DbError> =>
      Effect.try({
        try: () => {
          return schema.parse(entity)
        },
        catch: (cause) => new DbError({ cause, message: `Failed to parse ${entityType}, ${JSON.stringify(entity)}` }),
      });

    // Workflow methods
    const createWorkflow = (data: CreateWorkflowData): Effect.Effect<Workflow, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newWorkflowEntity: NewWorkflowEntity = {
            ...data,
            id: randomUUID(),
            source: JSON.stringify(data.source),
            pipeline: JSON.stringify(data.pipeline),
          };
          return db.insert(schema.workflow).values(newWorkflowEntity).returning();
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
        ),
        Effect.flatMap(entity => parseEntity<Workflow>(entity, workflowSchema, 'workflow'))
      );

    const getWorkflowById = (
      id: string
    ): Effect.Effect<RichWorkflow, WorkflowNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.workflow.findFirst({
            where: eq(schema.workflow.id, id),
            with: {
              user: true,
              items: true,
              runs: {
                with: {
                  user: true,
                }
              }
            },
          }),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to get workflow by id" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new WorkflowNotFoundError({ workflowId: id }))
        ),
        Effect.flatMap((workflow) =>
          parseEntity(
            workflow,
            richWorkflowSchema,
            `workflow data for workflow ${id}`
          )
        )
      );

    const getWorkflows = (): Effect.Effect<RichWorkflowSummary[], DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.workflow.findMany({
            columns: {
              id: true,
              name: true,
              status: true,
              schedule: true,
              createdAt: true,
              createdBy: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          }),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to get workflows" }),
      }).pipe(
        Effect.flatMap((workflows) =>
          Effect.forEach(workflows, (workflow) =>
            parseEntity(workflow, richWorkflowSummarySchema, "workflow summary")
          )
        )
      );

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
        ),
        Effect.flatMap(entity => parseEntity<Workflow>(entity, workflowSchema, 'workflow'))
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
            startedAt: new Date(),
            itemsProcessed: 0,
            itemsTotal: 0,
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
        ),
        Effect.flatMap(entity => parseEntity<WorkflowRun>(entity, workflowRunSchema, 'workflow run'))
      );

    const getWorkflowRuns = (
      workflowId: string
    ): Effect.Effect<Array<RichWorkflowRunSummary>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.workflowRun.findMany({
            where: eq(schema.workflowRun.workflowId, workflowId),
            with: {
              user: true,
            },
            orderBy: (runs, { desc }) => desc(runs.startedAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get runs for workflow",
          }),
      }).pipe(
        Effect.flatMap((runs) =>
          Effect.forEach(runs, (run) =>
            parseEntity(run, richWorkflowRunSummarySchema, "workflow run summary")
          )
        )
      );

    const getWorkflowRunById = (runId: string): Effect.Effect<RichWorkflowRun, WorkflowRunNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () => db.query.workflowRun.findFirst({
          where: eq(schema.workflowRun.id, runId),
          with: {
            user: true,
            pluginRuns: true,
          }
        }),
        catch: (cause) => new DbError({ cause, message: "Failed to get workflow run by id" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new WorkflowRunNotFoundError({ runId }))
        ),
        Effect.flatMap(entity => parseEntity<RichWorkflowRun>(entity, richWorkflowRunSchema, 'workflow run'))
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
        ),
        Effect.flatMap(entity => parseEntity<WorkflowRun>(entity, workflowRunSchema, 'workflow run'))
      );

    // Source item methods
    const upsertSourceItem = (data: CreateSourceItemData): Effect.Effect<SourceItem, DbError> =>
      Effect.tryPromise({
        try: () => {
          const newItem = {
            ...data,
            id: randomUUID(),
            createdAt: new Date(),
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
        ),
        Effect.flatMap(entity => parseEntity<SourceItem>(entity, sourceItemSchema, 'source item'))
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
      }).pipe(
        Effect.flatMap(items =>
          Effect.forEach(items, item =>
            parseEntity<SourceItem>(item, sourceItemSchema, 'source item')
          )
        )
      );

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
        ),
        Effect.flatMap(entity => parseEntity<PluginRun>(entity, pluginRunSchema, 'plugin run'))
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
        ),
        Effect.flatMap(entity => parseEntity<PluginRun>(entity, pluginRunSchema, 'plugin run'))
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
      }).pipe(
        Effect.flatMap(runs =>
          Effect.forEach(runs, run =>
            parseEntity<PluginRun>(run, pluginRunSchema, 'plugin run')
          )
        )
      );

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
        Effect.flatMap(result => requireRecord(
          result,
          new PluginRunNotFoundError({ stepId, runId: itemId }) // Use the correct error
        )),
        Effect.flatMap(entity => parseEntity<PluginRun>(entity, pluginRunSchema, 'plugin run'))
      );

    return {
      createWorkflow,
      getWorkflowById,
      getWorkflows,
      updateWorkflow,
      deleteWorkflow,
      createWorkflowRun,
      getWorkflowRunById,
      getWorkflowRuns,
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
