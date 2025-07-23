import { Cache, Context, Duration, Effect, Layer } from "effect";
import { loadPlugin as loadPluginFromSource } from "../plugin-service/revamp";
import { PluginError } from "./errors";
import type { PluginMetadata } from "./interfaces";
import registryData from "./registry.json";

const getPluginMetadata = (pluginName: string) =>
  registryData[pluginName as keyof typeof registryData] as PluginMetadata | undefined;

export class PluginLoaderTag extends Context.Tag("PluginLoader")<
  PluginLoaderTag,
  ReturnType<ReturnType<typeof loadPluginFromSource>>
>() { }

export const PluginLoaderLive = Layer.effect(
  PluginLoaderTag,
  Effect.gen(function* () {
    const moduleCache = yield* Cache.make({
      capacity: 50,
      timeToLive: Duration.minutes(30),
      lookup: (key: string) => Effect.succeed(null as any) // This should be a real lookup function if needed
    });

    return loadPluginFromSource(getPluginMetadata)(moduleCache);
  })
);

// Helper for getting plugin metadata
export const getPlugin = (pluginName: string): Effect.Effect<PluginMetadata, PluginError> =>
  Effect.gen(function* () {
    const plugin = getPluginMetadata(pluginName);
    if (!plugin) {
      return yield* Effect.fail(new PluginError({
        message: `Plugin ${pluginName} not found in registry`,
        pluginName,
        operation: "load"
      }));
    }
    return plugin;
  });
