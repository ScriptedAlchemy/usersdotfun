import { JobService } from "@usersdotfun/shared-db";
import { Effect } from "effect";
import { type PipelineExecutionError } from "./errors";
import type { Pipeline, PipelineExecutionContext } from "./interfaces";
import { PluginLoaderTag } from "./services";
import { executeStep } from "./step";
import { type StateService } from "../services/state.service";

export const executePipeline = (
  pipeline: Pipeline,
  initialInput: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<unknown, PipelineExecutionError, PluginLoaderTag | JobService | StateService> =>
  Effect.gen(function* () {
    let currentInput: Record<string, unknown> = initialInput;

    for (const step of pipeline.steps) {
      yield* Effect.logDebug(`Executing step "${step.stepId}" for item ${context.itemIndex} (run: ${context.runId}) with input:`, currentInput);
      const output = yield* executeStep(step, currentInput, context);
      currentInput = output.data as Record<string, unknown>;
    }

    return currentInput;
  });

// Parallel execution variant
export const executePipelineParallel = (
  pipeline: Pipeline,
  initialInput: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<unknown[], PipelineExecutionError, PluginLoaderTag | JobService | StateService> =>
  Effect.all(
    pipeline.steps.map((step) => executeStep(step, initialInput, context)),
    { concurrency: "unbounded" }
  );
