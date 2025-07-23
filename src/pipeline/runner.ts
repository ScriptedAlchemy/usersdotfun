import { Effect } from "effect";
import { type PipelineExecutionError } from "./errors";
import type { Pipeline } from "./interfaces";
import { PluginLoaderTag } from "./services";
import { executeStep } from "./step";

export const executePipeline = (
  pipeline: Pipeline,
  initialInput: Record<string, unknown>
): Effect.Effect<unknown, PipelineExecutionError, PluginLoaderTag> =>
  Effect.gen(function* () {
    let currentInput = initialInput;

    for (const step of pipeline.steps) {
      currentInput = yield* executeStep(step, currentInput);
    }

    return currentInput;
  });

// Parallel execution variant
export const executePipelineParallel = (
  pipeline: Pipeline,
  initialInput: Record<string, unknown>
): Effect.Effect<unknown[], PipelineExecutionError, PluginLoaderTag> =>
  Effect.all(
    pipeline.steps.map((step) => executeStep(step, initialInput)),
    { concurrency: "unbounded" }
  );
