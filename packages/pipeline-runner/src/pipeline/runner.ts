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
    let currentInput: Record<string, unknown> = initialInput;

    for (const step of pipeline.steps) {
      yield* Effect.logDebug(`Executing step "${step.stepId}" with input:`, currentInput);
      const output = yield* executeStep(step, currentInput);
      currentInput = output.data as Record<string, unknown>;
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
