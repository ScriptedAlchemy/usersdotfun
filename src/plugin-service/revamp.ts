import { loadRemote, registerRemotes } from "@module-federation/enhanced/runtime";
import { Cache, Effect, Schedule, Duration } from "effect";
import {
  PluginError
} from "../pipeline/errors";
import type {
  PipelinePlugin,
  PluginMetadata
} from "../pipeline/interfaces";

const retrySchedule = Schedule.exponential(Duration.millis(100)).pipe(
  Schedule.compose(Schedule.recurs(2))
);

export const loadPlugin = (
  getPluginMetadata: (name: string) => PluginMetadata | undefined
) => (
  moduleCache: Cache.Cache<string, new () => PipelinePlugin>
) => <TInput = unknown, TOutput = unknown, TConfig = unknown>(
  pluginName: string,
  config: TConfig,
  version?: string
): Effect.Effect<PipelinePlugin<TInput, TOutput, TConfig>, PluginError> =>
    Effect.gen(function* () {
      const metadata = getPluginMetadata(pluginName);
      if (!metadata) {
        return yield* Effect.fail(new PluginError({
          message: `Plugin ${pluginName} not found`,
          pluginName,
          operation: "load"
        }));
      }

      const url = resolveUrl(metadata.remoteUrl, version);
      const cacheKey = `${pluginName}:${url}`;

      // Get or load module
      const PluginConstructor = yield* moduleCache.get(cacheKey).pipe(
        Effect.catchAll(() => loadModule(cacheKey, pluginName, url, moduleCache))
      );

      // Create and initialize instance
      const instance = new PluginConstructor() as PipelinePlugin<TInput, TOutput, TConfig>;

      yield* Effect.tryPromise({
        try: () => instance.initialize(config),
        catch: (error): PluginError => new PluginError({
          message: `Failed to initialize ${pluginName}`,
          pluginName,
          operation: "initialize",
          cause: error,
          retryable: true
        })
      }).pipe(Effect.retry(retrySchedule));

      return instance;
    });

const loadModule = (
  cacheKey: string,
  pluginName: string,
  url: string,
  moduleCache: Cache.Cache<string, new () => PipelinePlugin>
): Effect.Effect<new () => PipelinePlugin, PluginError> =>
    Effect.gen(function* () {
      const remoteName = pluginName.toLowerCase().replace(/[@\/]/g, "_");

      // Register remote (no init needed with enhanced runtime!)
      yield* Effect.tryPromise({
        try: () => Promise.resolve(registerRemotes([{ name: remoteName, entry: url }])),
        catch: (error): PluginError => new PluginError({
          message: `Failed to register ${pluginName}`,
          pluginName,
          operation: "load",
          cause: error
        })
      });

      // Load module
      const container: any = yield* Effect.tryPromise({
        try: () => loadRemote(`${remoteName}/plugin`),
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

      yield* moduleCache.set(cacheKey, Constructor);
      return Constructor;
    });

const resolveUrl = (baseUrl: string, version?: string): string =>
  version && version !== "latest"
    ? baseUrl.replace("@latest", `@${version}`)
    : baseUrl;
