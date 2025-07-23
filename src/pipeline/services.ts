import { Context, Effect, Layer } from "effect";
import { createPluginCache, loadPlugin } from "../services/plugin.service";
import { ModuleFederationLive } from "../services/mf.service";
import { PluginError } from "./errors";
import type { PluginMetadata } from "./interfaces";
import registryData from "./registry.json";

const getPluginMetadata = (pluginName: string) =>
  registryData[pluginName as keyof typeof registryData] as PluginMetadata | undefined;

export class PluginLoaderTag extends Context.Tag("PluginLoader")<
  PluginLoaderTag,
  ReturnType<ReturnType<typeof loadPlugin>>
>() { }

export const PluginLoaderLive = Layer.effect(
  PluginLoaderTag,
  Effect.gen(function* () {
    const moduleCache = yield* createPluginCache();
    return loadPlugin(getPluginMetadata)(moduleCache);
  })
).pipe(Layer.provide(ModuleFederationLive));

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
