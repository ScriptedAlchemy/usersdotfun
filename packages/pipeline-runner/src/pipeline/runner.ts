import { WorkflowService } from "@usersdotfun/shared-db";
import { Effect } from "effect";
import { type PipelineExecutionError } from "./errors";
import { PluginLoaderTag } from "./services";
import { executeStep } from "./step";
import type { StateService } from "@usersdotfun/shared-queue";
import { type EnvironmentService } from "../services/environment.service";
import type { PipelineExecutionContext } from "./interfaces";
import type { WorkflowPipeline } from "@usersdotfun/shared-types/types";

export const executePipeline = (
  pipeline: WorkflowPipeline,
  initialInput: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<unknown, PipelineExecutionError, PluginLoaderTag | WorkflowService | StateService | EnvironmentService> =>
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
  pipeline: WorkflowPipeline,
  initialInput: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<unknown[], PipelineExecutionError, PluginLoaderTag | WorkflowService | StateService | EnvironmentService> =>
  Effect.all(
    pipeline.steps.map((step) => executeStep(step, initialInput, context)),
    { concurrency: "unbounded" }
  );
