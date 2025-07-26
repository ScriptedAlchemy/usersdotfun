import { JobService } from "@usersdotfun/shared-db";
import { Effect } from "effect";
import { type PipelineExecutionError } from "./errors";
import type { Pipeline } from "./interfaces";
import { PluginLoaderTag } from "./services";
import { executeStep } from "./step";

export const executePipeline = (
  pipeline: Pipeline,
  initialInput: Record<string, unknown>,
  jobId: string,
): Effect.Effect<unknown, PipelineExecutionError, PluginLoaderTag | JobService> =>
  Effect.gen(function* () {
    let currentInput: Record<string, unknown> = initialInput;

    for (const step of pipeline.steps) {
      yield* Effect.logDebug(`Executing step "${step.stepId}" with input:`, currentInput);
      const output = yield* executeStep(step, currentInput, jobId);
      currentInput = output.data as Record<string, unknown>;
    }

    return currentInput;
  });

// Parallel execution variant
export const executePipelineParallel = (
  pipeline: Pipeline,
  initialInput: Record<string, unknown>,
  jobId: string,
): Effect.Effect<unknown[], PipelineExecutionError, PluginLoaderTag | JobService> =>
  Effect.all(
    pipeline.steps.map((step) => executeStep(step, initialInput, jobId)),
    { concurrency: "unbounded" }
  );
