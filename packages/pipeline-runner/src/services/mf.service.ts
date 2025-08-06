import { init, getInstance } from "@module-federation/enhanced/runtime";
import { setGlobalFederationInstance } from "@module-federation/runtime-core";
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
      let instance = getInstance();

      if (!instance) {
        instance = init({
          name: "host",
          remotes: [],
        });

        // // ensure the runtime can locate this instance globally
        // setGlobalFederationInstance(instance);
      }

      return instance;
    } catch (error) {
      throw new Error(`Failed to initialize Module Federation: ${error}`);
    }
  })
);

export const ModuleFederationLive = Layer.effect(
  ModuleFederationTag,
  Effect.flatten(createModuleFederationInstance)
);
