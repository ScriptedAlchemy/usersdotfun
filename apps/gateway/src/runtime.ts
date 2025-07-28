import { BunTerminal } from "@effect/platform-bun";
import { DatabaseLive, DatabaseConfig, JobServiceLive } from '@usersdotfun/shared-db';
import { QueueStatusServiceLive, RedisConfigLive, RedisAppConfig, StateServiceLive } from "@usersdotfun/shared-queue";
import { Layer, Logger, LogLevel, ConfigProvider, Effect, Redacted } from 'effect';
import { AppConfig, AppConfigLive } from './services/config.service';
import { JobMonitoringServiceLive } from './services/job-monitoring.service';

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

const RedisAppConfigLayer = Layer.effect(
  RedisAppConfig,
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
  Layer.provide(RedisAppConfigLayer)
);

// Step 4: Service layers - these depend on infrastructure
const JobServiceLayer = JobServiceLive.pipe(
  Layer.provide(DatabaseLayer)
);

const StateServiceLayer = StateServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const QueueStatusServiceLayer = QueueStatusServiceLive.pipe(
  Layer.provide(RedisLayer)
);

// Step 5: Monitoring layer - depends on other services
const MonitoringLayer = JobMonitoringServiceLive.pipe(
  Layer.provide(Layer.mergeAll(
    StateServiceLayer,
    JobServiceLayer,
    QueueStatusServiceLayer
  ))
);

// Step 6: Final composition - merge all resolved layers
export const AppLayer = Layer.mergeAll(
  ConfigLayer,
  LoggingLayer,
  DatabaseLayer,
  RedisLayer,
  JobServiceLayer,
  StateServiceLayer,
  QueueStatusServiceLayer,
  MonitoringLayer
);