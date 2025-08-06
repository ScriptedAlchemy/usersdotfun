import { BunTerminal } from "@effect/platform-bun";
import { Terminal } from "@effect/platform/Terminal";
import {
  DatabaseConfig,
  DatabaseLive,
  WorkflowService,
  WorkflowServiceLive,
} from "@usersdotfun/shared-db";
import {
  QueueConfig,
  QueueService,
  QueueServiceLive,
  QueueStatusService,
  QueueStatusServiceLive,
  RedisConfigLive,
  StateService,
  StateServiceLive,
} from "@usersdotfun/shared-queue";
import {
  ConfigProvider,
  Effect,
  Layer,
  Logger,
  LogLevel,
  ManagedRuntime,
  Redacted,
} from "effect";
import { AppConfig, AppConfigLive } from "./services/config.service";
import {
  WebSocketService,
  WebSocketServiceLive,
} from "./services/websocket.service";

// --- CONFIGURATION LAYERS ---
const ConfigLayer = AppConfigLive.pipe(
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
);

const DatabaseConfigLayer = Layer.effect(
  DatabaseConfig,
  Effect.map(AppConfig, (config) => ({
    connectionString: Redacted.value(config.databaseUrl),
  })),
);

const QueueConfigLayer = Layer.effect(
  QueueConfig,
  Effect.map(AppConfig, (config) => ({
    redisUrl: config.redisUrl
  })),
);

// --- INFRASTRUCTURE LAYERS ---
const LoggingLayer = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info),
);

const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(DatabaseConfigLayer),
  Layer.provide(ConfigLayer),
);

const RedisLayer = RedisConfigLive.pipe(
  Layer.provide(QueueConfigLayer),
  Layer.provide(ConfigLayer),
);

// --- SERVICE LAYERS ---
const WorkflowServiceLayer = WorkflowServiceLive.pipe(
  Layer.provide(DatabaseLayer),
);

const StateServiceLayer = StateServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const QueueStatusServiceLayer = QueueStatusServiceLive.pipe(
  Layer.provide(RedisLayer),
);

const QueueServiceLayer = QueueServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const WebSocketServiceLayer = WebSocketServiceLive.pipe(
  Layer.provide(StateServiceLayer),
  Layer.provide(ConfigLayer),
);

// --- APPLICATION LAYER ---
export const AppLayer = Layer.mergeAll(
  LoggingLayer,
  WorkflowServiceLayer,
  StateServiceLayer,
  QueueStatusServiceLayer,
  QueueServiceLayer,
  WebSocketServiceLayer,
);

// --- RUNTIME ---
export const AppRuntime = ManagedRuntime.make(Layer.provide(AppLayer, Layer.scope));

// --- CONTEXT TYPE (Fixed: Using intersection instead of union) ---
export type AppContext =
  & Terminal
  & WorkflowService
  & StateService
  & QueueStatusService
  & QueueService
  & WebSocketService;

export type AppRuntimeType = typeof AppRuntime;