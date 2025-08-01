import { Context, Effect, Layer } from "effect";
import { ModuleFederationLive } from "../services/mf.service";
import { createPluginCache, loadPlugin } from "../services/plugin.service";
import { PluginError } from "./errors";
import registryData from "../../../registry-builder/registry.json" with { type: "json" };
import type { PluginMetadata, PluginRegistry } from "@usersdotfun/core-sdk";

const getPluginMetadata = (pluginId: string): PluginMetadata | undefined =>
  (registryData as PluginRegistry)[pluginId];

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
export const getPlugin = (pluginId: string): Effect.Effect<PluginMetadata, PluginError> =>
  Effect.gen(function* () {
    const plugin = getPluginMetadata(pluginId);
    if (!plugin) {
      return yield* Effect.fail(new PluginError({
        message: `Plugin ${pluginId} not found in registry`,
        pluginId,
        operation: "load"
      }));
    }
    return plugin;
  });
