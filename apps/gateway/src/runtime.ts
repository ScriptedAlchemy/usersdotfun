import { BunTerminal } from "@effect/platform-bun";
import { DatabaseLive, JobServiceLive } from '@usersdotfun/shared-db';
import { Layer, Logger, LogLevel } from 'effect';
import { AppConfigLive } from './services/config.service';
import { DatabaseConfigLive } from './services/database.service';
import { JobMonitoringServiceLive } from './services/job-monitoring.service';
import { QueueStatusServiceLive } from './services/queue-status.service';
import { RedisConfigLive } from './services/redis-config.service';
import { StateServiceLive } from './services/state.service';

const ConfigLayer = AppConfigLive;

const InfrastructureLayer = Layer.mergeAll(
  RedisConfigLive,
  DatabaseConfigLive
).pipe(Layer.provide(ConfigLayer));

const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(InfrastructureLayer)
);

const RedisServicesLayer = Layer.mergeAll(
  StateServiceLive,
  QueueStatusServiceLive
).pipe(Layer.provide(InfrastructureLayer));

const MonitoringServicesLayer = JobMonitoringServiceLive.pipe(
  Layer.provide(Layer.mergeAll(RedisServicesLayer, DatabaseLayer))
);

const LoggingLayer = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);


const ServicesLayer = Layer.mergeAll(
  JobServiceLive.pipe(Layer.provide(DatabaseLayer)),
  RedisServicesLayer,
  MonitoringServicesLayer,
).pipe(
  Layer.provide(Layer.mergeAll(ConfigLayer, InfrastructureLayer, LoggingLayer))
);

export const AppRuntime = Layer.toRuntime(ServicesLayer);
