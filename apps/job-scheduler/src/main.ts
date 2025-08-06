import { BunTerminal } from "@effect/platform-bun";
import { EnvironmentServiceLive, ModuleFederationLive, PluginServiceLive, SecretsConfigLive, StateServiceTag } from '@usersdotfun/pipeline-runner';
import { DatabaseConfig, DatabaseLive, WorkflowService, WorkflowServiceLive } from '@usersdotfun/shared-db';
import { QueueConfig, QueueService, QueueServiceLive, RedisConfigLive, StateService, StateServiceLive } from '@usersdotfun/shared-queue';
import { QUEUE_NAMES } from '@usersdotfun/shared-types/types';
import { ConfigProvider, Effect, Layer, Logger, LogLevel, Redacted } from 'effect';
import { runPromise } from "effect-errors";
import { AppConfig, AppConfigLive } from './config';
import { createPipelineWorker } from './workers/pipeline.worker';
import { createSourceWorker } from './workers/source.worker';
import { createWorkflowWorker } from './workers/workflow.worker';

// Step 1: Base layers
const ConfigLayer = AppConfigLive.pipe(
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
);

const LoggingLayer = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

// Step 2: Bridge layers - these depend on ConfigLayer
const DatabaseConfigLayer = Layer.effect(
  DatabaseConfig,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    return {
      connectionString: Redacted.value(appConfig.databaseUrl)
    };
  })
).pipe(
  Layer.provide(ConfigLayer)
);

const QueueConfigLayer = Layer.effect(
  QueueConfig,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    return { redisUrl: appConfig.redisUrl };
  })
).pipe(
  Layer.provide(ConfigLayer)
);

// Step 3: Infrastructure layers - these depend on bridge layers
const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(DatabaseConfigLayer)
);

const RedisLayer = RedisConfigLive.pipe(
  Layer.provide(QueueConfigLayer)
);

// Step 4: Service layers - these depend on infrastructure
const QueueServiceLayer = QueueServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const StateServiceLayer = StateServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const WorkflowServiceLayer = WorkflowServiceLive.pipe(
  Layer.provide(DatabaseLayer)
);

// Step 5: SecretsConfig layer - provides configuration for secrets
const SecretsConfigLayer = SecretsConfigLive.pipe(
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
);

// Step 6: EnvironmentService layer - depends on SecretsConfig
const EnvironmentServiceLayer = EnvironmentServiceLive.pipe(
  Layer.provide(SecretsConfigLayer)
);

// Step 7: ModuleFederation layer - standalone
const ModuleFederationLayer = ModuleFederationLive;

// Step 8: PluginService layer - depends on ModuleFederation and EnvironmentService
const PluginServiceLayer = PluginServiceLive.pipe(
  Layer.provide(Layer.mergeAll(ModuleFederationLayer, EnvironmentServiceLayer))
);

// Step 7: Pipeline bridge layer - depends on StateService
const PipelineStateServiceLayer = Layer.effect(
  StateServiceTag,
  Effect.gen(function* () {
    return yield* StateService;
  })
).pipe(
  Layer.provide(StateServiceLayer)
);

// Step 9: Final composition - merge all resolved layers
const AppLayer = Layer.mergeAll(
  ConfigLayer,
  LoggingLayer,
  DatabaseLayer,
  RedisLayer,
  QueueServiceLayer,
  StateServiceLayer,
  WorkflowServiceLayer,
  PluginServiceLayer,
  SecretsConfigLayer,
  EnvironmentServiceLayer,
  ModuleFederationLayer,
  PipelineStateServiceLayer
);

const program = Effect.gen(function* () {
  const queueService = yield* QueueService;
  const workflowService = yield* WorkflowService;

  yield* Effect.log('Fetching workflows from database...');
  const workflows = yield* workflowService.getWorkflows();
  const activeWorkflows = workflows.filter(workflow => workflow.status === 'ACTIVE');
  const scheduledWorkflows = activeWorkflows.filter(workflow => workflow.schedule && workflow.schedule.trim() !== '');

  yield* Effect.log(`Found ${activeWorkflows.length} active workflows, ${scheduledWorkflows.length} with schedules`);

  // Upsert scheduled jobs for active workflows with schedules
  yield* Effect.forEach(
    scheduledWorkflows,
    (workflow) =>
      Effect.gen(function* () {
        const run = yield* workflowService.createWorkflowRun({
          workflowId: workflow.id,
          status: 'PENDING',
          triggeredBy: 'system',
        });
        yield* queueService.upsertScheduledJob(
          QUEUE_NAMES.WORKFLOW_RUN,
          workflow.id, // Use workflow ID as scheduler ID
          { pattern: workflow.schedule! }, // Cron pattern
          {
            name: 'scheduled-workflow-run',
            data: {
              workflowId: workflow.id,
              workflowRunId: run.id,
              data: { triggeredBy: workflow.createdBy },
            },
          }
        );
        yield* Effect.log(`Upserted scheduled job for workflow "${workflow.name}" (${workflow.id})`);
      }),
    { concurrency: 5, discard: true }
  );

  yield* Effect.log('Starting workers...');
  yield* Effect.fork(createWorkflowWorker);
  yield* Effect.fork(createSourceWorker);
  yield* Effect.fork(createPipelineWorker);

  yield* Effect.log('Job scheduler and workers are running.');
  yield* Effect.never;
});

const runnable = program.pipe(
  Effect.provide(AppLayer),
  Effect.scoped
);

runPromise(runnable).catch(console.error);
