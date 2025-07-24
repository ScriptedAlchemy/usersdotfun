import { init } from "@module-federation/enhanced/runtime";
import { Context, Effect, Layer } from "effect";

type ModuleFederation = ReturnType<typeof init>;

export class ModuleFederationTag extends Context.Tag("ModuleFederation")<
  ModuleFederationTag,
  ModuleFederation
>() { }

// Cached effect that ensures single instance creation
const createModuleFederationInstance = Effect.cached(
  Effect.sync(() => {
    try {
      return init({
        name: "host",
        remotes: [],
      });
    } catch (error) {
      throw new Error(`Failed to initialize Module Federation: ${error}`);
    }
  })
);

export const ModuleFederationLive = Layer.effect(
  ModuleFederationTag,
  Effect.flatten(createModuleFederationInstance)
);
