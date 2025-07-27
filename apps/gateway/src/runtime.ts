import { DatabaseLive, JobServiceLive } from '@usersdotfun/shared-db';
import { Layer } from 'effect';
import { AppConfigLive } from './services/config.service';
import { DatabaseConfigLive } from './services/database.service';

const ConfigLayer = AppConfigLive;

const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(DatabaseConfigLive.pipe(Layer.provide(ConfigLayer)))
);

const ServicesLayer = JobServiceLive.pipe(
  Layer.provide(DatabaseLayer)
);

export const AppRuntime = Layer.toRuntime(ServicesLayer);