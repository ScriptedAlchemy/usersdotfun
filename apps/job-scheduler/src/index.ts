import { Effect, Layer, LogLevel, Logger, Scope } from 'effect';
import * as cron from 'node-cron';
import {
  executePipeline,
  PluginLoaderLive,
  PluginLoaderTag,
  type Pipeline,
  type PipelinePlugin,
  PluginError,
} from '@usersdotfun/pipeline-runner';

// --- Types ---
interface Job {
  id: string;
  name: string;
  schedule: string;
  source: {
    plugin: string;
    config: any;
    search: any;
  };
  pipeline: Pipeline;
}

interface SourcePlugin extends PipelinePlugin {
  execute(input: {
    searchOptions: unknown;
    lastProcessedState: unknown | null;
  }): Promise<{ success: boolean; data?: { items: any[] }; errors?: any[] }>;
}

// --- Services ---
const JobsService = Effect.gen(function* (_) {
  const loadJobs = Effect.tryPromise({
    try: async (): Promise<Job[]> => {
      const file = Bun.file('./jobs.json');
      const content = await file.text();
      const config = JSON.parse(content) as { jobs: Job[] };
      return config.jobs || [];
    },
    catch: (error) => new Error(`Failed to load jobs.json: ${error}`),
  });

  return { loadJobs };
});

const SchedulerService = Effect.gen(function* (_) {
  const tasks: cron.ScheduledTask[] = [];

  const executeJob = (job: Job) =>
    Effect.gen(function* (_) {
      yield* _(Effect.log(`Executing job: ${job.name}`));

      const loadPlugin = yield* _(PluginLoaderTag);
      const plugin = yield* _(loadPlugin(job.source.plugin, job.source.config));

      if (plugin.type !== 'source') {
        return yield* _(
          Effect.fail(
            new PluginError({
              pluginName: job.source.plugin,
              message: `Expected source plugin, got ${plugin.type}`,
              operation: 'load',
            })
          )
        );
      }

      const sourcePlugin = plugin as SourcePlugin;

      const sourceResult = yield* _(
        Effect.tryPromise({
          try: () =>
            sourcePlugin.execute({
              searchOptions: job.source.search,
              lastProcessedState: null,
            }),
          catch: (error) =>
            new PluginError({
              pluginName: job.source.plugin,
              cause: error,
              operation: 'execute',
              message: 'Source plugin execution failed',
            }),
        })
      );

      if (!sourceResult.success) {
        return yield* _(
          Effect.fail(
            new PluginError({
              pluginName: job.source.plugin,
              message: `Source plugin failed: ${JSON.stringify(sourceResult.errors)}`,
              operation: 'execute',
            })
          )
        );
      }

      const items = sourceResult.data?.items ?? [];
      yield* _(Effect.log(`Found ${items.length} items from source`));

      yield* _(
        Effect.forEach(
          items,
          (item) => executePipeline(job.pipeline, item),
          { concurrency: 'unbounded', discard: true }
        )
      );

      yield* _(Effect.log(`Job ${job.name} completed successfully`));
    });

  const scheduleJob = (job: Job) =>
    Effect.gen(function* (_) {
      if (!cron.validate(job.schedule)) {
        yield* _(
          Effect.logError(
            `Invalid cron schedule for job ${job.name}: ${job.schedule}`
          )
        );
        return;
      }

      yield* _(
        Effect.log(`Scheduling job: ${job.name} with schedule: ${job.schedule}`)
      );

      const task = cron.schedule(job.schedule, () => {
        // Execute the job effect in a fire-and-forget manner
        Effect.runPromise(
          executeJob(job).pipe(
            Effect.provide(AppLive),
            Effect.catchAll((error) =>
              Effect.logError(`Job ${job.name} failed`, error)
            )
          )
        ).catch(console.error);
      });

      task.start();
      tasks.push(task);
    });

  const scheduleAllJobs = (jobs: Job[]) =>
    Effect.gen(function* (_) {
      yield* _(Effect.log(`Starting scheduler with ${jobs.length} jobs...`));

      yield* _(
        Effect.forEach(
          jobs,
          (job) =>
            scheduleJob(job).pipe(
              Effect.catchAll((error) =>
                Effect.logError(`Failed to schedule job ${job.name}`, error)
              )
            ),
          { concurrency: 'unbounded', discard: true }
        )
      );
    });

  const cleanup = Effect.sync(() => {
    tasks.forEach((task) => task.destroy());
    tasks.length = 0;
  });

  return { scheduleAllJobs, cleanup };
});

// --- Main Application Layer ---
const AppLive = Layer.mergeAll(
  PluginLoaderLive,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

// --- Main Program ---
const program = Effect.scoped(
  Effect.gen(function* (_) {
    const jobsService = yield* _(JobsService);
    const schedulerService = yield* _(SchedulerService);

    // Set up graceful shutdown first
    yield* _(
      Effect.addFinalizer(() =>
        Effect.gen(function* (_) {
          yield* _(Effect.log('Shutting down gracefully...'));
          yield* _(schedulerService.cleanup);
        })
      )
    );

    // Load and schedule jobs
    const jobs = yield* _(jobsService.loadJobs);
    yield* _(schedulerService.scheduleAllJobs(jobs));

    yield* _(Effect.log(`Job scheduler started with ${jobs.length} jobs`));

    // Keep program alive and handle shutdown signals
    yield* _(
      Effect.async<void, never>((resume) => {
        const shutdown = () => {
          resume(Effect.succeed(undefined));
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        return Effect.sync(() => {
          process.off('SIGINT', shutdown);
          process.off('SIGTERM', shutdown);
        });
      })
    );
  })
);

// Start the application
const main = program.pipe(Effect.provide(AppLive));

Effect.runPromise(main).catch((error) => {
  console.error('Failed to start scheduler:', error);
  process.exit(1);
});