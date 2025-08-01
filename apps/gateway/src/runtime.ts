import { BunTerminal } from "@effect/platform-bun";
import type { Terminal } from "@effect/platform/Terminal";
import { DatabaseConfig, DatabaseLive, WorkflowService, WorkflowServiceLive } from '@usersdotfun/shared-db';
import { 
  QueueService, 
  QueueServiceLive, 
  QueueStatusService, 
  QueueStatusServiceLive, 
  RedisAppConfig, 
  RedisConfigLive, 
  StateService, 
  StateServiceLive 
} from "@usersdotfun/shared-queue";
import { ConfigProvider, Effect, Layer, Logger, LogLevel, ManagedRuntime, Redacted } from 'effect';
import { AppConfig, AppConfigLive } from './services/config.service';

// Base Layers (no dependencies)
const ConfigLayer = AppConfigLive.pipe(
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
);

const LoggingLayer = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

// Bridge Layers (depend on base config)
const DatabaseConfigLayer = Layer.effect(
  DatabaseConfig,
  Effect.map(AppConfig, (config) => ({ connectionString: Redacted.value(config.databaseUrl) }))
);

const RedisAppConfigLayer = Layer.effect(
  RedisAppConfig,
  Effect.map(AppConfig, (config) => ({ redisUrl: config.redisUrl }))
);

// Infrastructure Layers (depend on bridge layers)
const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(DatabaseConfigLayer),
  Layer.provide(ConfigLayer)
);

const RedisLayer = RedisConfigLive.pipe(
  Layer.provide(RedisAppConfigLayer),
  Layer.provide(ConfigLayer)
);

// Core Service Layers (depend on infrastructure)
const WorkflowServiceLayer = WorkflowServiceLive.pipe(Layer.provide(DatabaseLayer));
const StateServiceLayer = StateServiceLive.pipe(Layer.provide(RedisLayer));
const QueueStatusServiceLayer = QueueStatusServiceLive.pipe(Layer.provide(RedisLayer));
const QueueServiceLayer = QueueServiceLive.pipe(Layer.provide(RedisLayer));

// Application Layer
export const AppLayer = Layer.mergeAll(
  LoggingLayer,
  WorkflowServiceLayer,
  StateServiceLayer,
  QueueStatusServiceLayer,
  QueueServiceLayer
);

// --- RUNTIME ---

// Create a managed runtime from the AppLayer
export const AppRuntime = ManagedRuntime.make(AppLayer);

// Type representing ALL services provided by AppLayer
export type AppContext = 
  | Terminal 
  | WorkflowService 
  | StateService 
  | QueueStatusService 
  | QueueService;