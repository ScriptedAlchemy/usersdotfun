import { Cache, Effect, Schedule, Duration } from "effect";
import {
  PluginError
} from "../pipeline/errors";
import { ModuleFederationTag } from "./mf.service";
import type {
  PipelinePlugin,
  PluginMetadata
} from "../pipeline/interfaces";

const retrySchedule = Schedule.exponential(Duration.millis(100)).pipe(
  Schedule.compose(Schedule.recurs(2))
);

// Internal function to load a module via Module Federation
const loadModuleInternal = (
  pluginName: string,
  url: string
): Effect.Effect<new () => PipelinePlugin, PluginError, ModuleFederationTag> =>
  Effect.gen(function* () {
    // Verify the remote entry is accessible
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { method: "HEAD" }),
      catch: (error) => new PluginError({
        message: `Network error while fetching plugin ${pluginName} from ${url}`,
        pluginName,
        operation: "load",
        cause: error,
      }),
    });

    if (!response.ok) {
      return yield* Effect.fail(new PluginError({
        message: `Plugin ${pluginName} not found at ${url} (status: ${response.status})`,
        pluginName,
        operation: "load",
      }));
    }

    const mf = yield* ModuleFederationTag;
    const remoteName = pluginName.toLowerCase().replace(/[@\/]/g, "_");

    // Register remote
    yield* Effect.tryPromise({
      try: () => Promise.resolve(mf.registerRemotes([{ name: remoteName, entry: url }])),
      catch: (error): PluginError => new PluginError({
        message: `Failed to register ${pluginName}`,
        pluginName,
        operation: "load",
        cause: error
      })
    });

    // Load module
    const container: any = yield* Effect.tryPromise({
      try: () => mf.loadRemote(`${remoteName}/plugin`),
      catch: (error): PluginError => new PluginError({
        message: `Failed to load ${pluginName}`,
        pluginName,
        operation: "load",
        cause: error
      })
    });

    const Constructor = typeof container === "function" ? container : container?.default;
    if (!Constructor) {
      return yield* Effect.fail(new PluginError({
        message: `Invalid plugin format: ${pluginName}`,
        pluginName,
        operation: "load"
      }));
    }

    return Constructor;
  });

// Create the cache with integrated loading logic
export const createPluginCache = (): Effect.Effect<
  Cache.Cache<string, new () => PipelinePlugin, PluginError>,
  never,
  ModuleFederationTag
> =>
  Cache.make({
    capacity: 50,
    timeToLive: Duration.minutes(30),
    lookup: (cacheKey: string): Effect.Effect<new () => PipelinePlugin, PluginError, ModuleFederationTag> => {
      // Parse cache key: "pluginName:url"
      const colonIndex = cacheKey.indexOf(":");
      if (colonIndex === -1) {
        return Effect.fail(
          new PluginError({
            message: `Invalid cache key format: ${cacheKey}`,
            pluginName: cacheKey,
            operation: "load",
          })
        );
      }

      const pluginName = cacheKey.substring(0, colonIndex);
      const url = cacheKey.substring(colonIndex + 1);

      return loadModuleInternal(pluginName, url);
    },
  });

// Plugin loader using combinators
export const loadPlugin = (
  getPluginMetadata: (name: string) => PluginMetadata | undefined
) => (
  moduleCache: Cache.Cache<string, new () => PipelinePlugin, PluginError>
) => <TInput = unknown, TOutput = unknown, TConfig = unknown>(
  pluginName: string,
  config: TConfig,
  version?: string
): Effect.Effect<PipelinePlugin<TInput, TOutput, TConfig>, PluginError> => {

      // Get metadata or fail
      const getMetadata: Effect.Effect<PluginMetadata, PluginError> = Effect.sync(() => {
        const metadata = getPluginMetadata(pluginName);
        if (!metadata) {
          throw new PluginError({
            message: `Plugin ${pluginName} not found`,
            pluginName,
            operation: "load"
          });
        }
        return metadata;
      }).pipe(
        Effect.catchAll((error: unknown) => {
          const pluginError = error instanceof PluginError
            ? error
            : new PluginError({
              message: `Plugin ${pluginName} not found`,
              pluginName,
              operation: "load",
              cause: error
            });
          return Effect.fail(pluginError);
        })
      );

      // Build cache key
      const getCacheKey = getMetadata.pipe(
        Effect.map(metadata => ({
          metadata,
          url: resolveUrl(metadata.remoteUrl, version),
          cacheKey: `${pluginName}:${resolveUrl(metadata.remoteUrl, version)}`
        }))
      );

      // Get constructor from cache
      const getConstructor: Effect.Effect<new () => PipelinePlugin, PluginError> = getCacheKey.pipe(
        Effect.flatMap(({ cacheKey }) =>
          moduleCache.get(cacheKey).pipe(  // <- Use instance method, not static
            Effect.mapError((error: unknown): PluginError => {
              if (error instanceof PluginError) {
                return error;
              }
              return new PluginError({
                message: `Cache error for ${pluginName}`,
                pluginName,
                operation: "load",
                cause: error
              });
            })
          )
        )
      );

      // Create and initialize instance
      const createAndInitialize: Effect.Effect<PipelinePlugin<TInput, TOutput, TConfig>, PluginError> = getConstructor.pipe(
        Effect.flatMap((PluginConstructor: new () => PipelinePlugin) => {
          const instance = new PluginConstructor() as PipelinePlugin<TInput, TOutput, TConfig>;

          // Initialize with retry
          const initialize: Effect.Effect<void, PluginError> = Effect.tryPromise({
            try: () => instance.initialize(config),
            catch: (error): PluginError => new PluginError({
              message: `Failed to initialize ${pluginName}`,
              pluginName,
              operation: "initialize",
              cause: error,
              retryable: true
            })
          }).pipe(Effect.retry(retrySchedule));

          // Return instance after successful initialization
          return initialize.pipe(Effect.map(() => instance));
        })
      );

      return createAndInitialize;
    };

const resolveUrl = (baseUrl: string, version?: string): string =>
  version && version !== "latest"
    ? baseUrl.replace("@latest", `@${version}`)
    : baseUrl;
