import { BunTerminal } from "@effect/platform-bun";
import { Effect, Layer, Logger, LogLevel } from "effect";
import { runPromise } from "effect-errors";
import { executePipeline } from "./src/pipeline/runner";
import type { Pipeline } from "./src/pipeline/interfaces";
import { PluginLoaderLive } from "./src/pipeline/services";

const program = Effect.gen(function* () {
  const pipeline: Pipeline = {
    id: "test-pipeline",
    name: "Simple Transform Pipeline",
    steps: [
      {
        pluginName: "@curatedotfun/simple-transform",
        config: { multiplier: 2, prefix: "Processed: " },
        stepId: "transform-1"
      }
    ]
  };

  const input = {
    value: 42,
    message: "Hello World"
  };

  yield* Effect.log("Starting pipeline execution...");

  const result = yield* executePipeline(pipeline, input);

  yield* Effect.log(`Pipeline completed successfully`);
  yield* Effect.log(`Result: ${JSON.stringify(result, null, 2)}`);

  return result;
});


const LoggingLive = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

const AppLive = Layer.mergeAll(
  PluginLoaderLive,
  LoggingLive
);

const runnable = program.pipe(
  Effect.provide(AppLive)
)

try {
  const result = await runPromise(runnable);
  console.log("✅ Pipeline completed successfully");
  console.log("📊 Final Result:", result);
} catch (error) {
  console.error("❌ Pipeline failed - see errors above");
  process.exit(1);
}
