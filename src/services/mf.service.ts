import { createInstance } from "@module-federation/enhanced/runtime";
import { Context, Effect, Layer } from "effect";

type ModuleFederation = ReturnType<typeof createInstance>;

// Create a context tag for the service
export class ModuleFederationTag extends Context.Tag("ModuleFederation")<
  ModuleFederationTag,
  ModuleFederation
>() { }

// Create a live layer for the service
export const ModuleFederationLive = Layer.effect(
  ModuleFederationTag,
  Effect.sync(() =>
    createInstance({
      name: "host",
      remotes: [],
    })
  )
);
