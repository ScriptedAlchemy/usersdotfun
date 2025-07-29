import { JobService } from "@usersdotfun/shared-db";
import { Effect } from "effect";
import { PluginError, type StepError } from "./errors";
import type { PipelineStep, PipelineExecutionContext } from "./interfaces";
import { getPlugin, PluginLoaderTag } from "./services";
import { SchemaValidator } from "./validation";
import { StateServiceTag, type StateService } from "../services/state.service";
import { EnvironmentServiceTag, type EnvironmentService } from "../services/environment.service";

export const executeStep = (
  step: PipelineStep,
  input: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<Record<string, unknown>, StepError, PluginLoaderTag | JobService | StateService | EnvironmentService> =>
  Effect.gen(function* () {
    const jobService = yield* JobService;
    const stateService = yield* StateServiceTag;
    const environmentService = yield* EnvironmentServiceTag;
    const startTime = new Date();
    
    // Create deterministic step ID using context
    const stepId = `${context.runId}:${step.stepId}:${context.itemIndex}`;
    const redisStepKey = `pipeline-item:${context.runId}:${context.itemIndex}`;
    
    // Store step data in Redis for real-time monitoring
    yield* stateService.set(redisStepKey, {
      stepId,
      runId: context.runId,
      itemIndex: context.itemIndex,
      sourceJobId: context.sourceJobId,
      jobId: context.jobId,
      pluginName: step.pluginName,
      config: step.config,
      input,
      status: "processing",
      startedAt: startTime,
    }).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Failed to store step state in Redis: ${error.message}`,
        cause: error,
      }))
    );
    
    yield* jobService.createPipelineStep({
      id: stepId,
      jobId: context.jobId,
      stepId: step.stepId,
      pluginName: step.pluginName,
      config: step.config,
      status: "processing",
      startedAt: startTime,
      input,
    });

    const loadPlugin = yield* PluginLoaderTag;
    const pluginMeta = yield* getPlugin(step.pluginName);

    // 1. Initial Validation of Raw Config
    const validatedRawConfig = yield* SchemaValidator.validate(
      pluginMeta.configSchema,
      step.config,
      `Step "${step.stepId}" raw config for plugin "${step.pluginName}"`
    );

    // 2. Secret Hydration
    const hydratedConfig = yield* environmentService.hydrateSecrets(
      validatedRawConfig,
      pluginMeta.configSchema
    ).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: step.pluginName,
        operation: "hydrate-secrets",
        message: `Failed to hydrate secrets for plugin ${step.pluginName} config: ${error.message}`,
        cause: error,
      }))
    );

    // 3. Post-Hydration Validation of Config
    const finalValidatedConfig = yield* SchemaValidator.validate(
      pluginMeta.configSchema,
      hydratedConfig,
      `Step "${step.stepId}" hydrated config for plugin "${step.pluginName}"`
    );

    const plugin = yield* loadPlugin(step.pluginName, finalValidatedConfig, pluginMeta.version);

    const validatedInput = yield* SchemaValidator.validate(
      pluginMeta.inputSchema,
      input,
      `Step "${step.stepId}" input for plugin "${step.pluginName}`
    );

    const output = yield* Effect.tryPromise({
      try: () => plugin.execute(validatedInput),
      catch: (error) => new PluginError({
        pluginName: step.pluginName,
        cause: error,
        operation: "execute",
        message: `Failed to execute plugin ${step.pluginName}`,
      })
    }).pipe(
      Effect.mapError((error) => {
        jobService.updatePipelineStep(stepId, {
          status: "failed",
          error,
          completedAt: new Date(),
        });
        return error;
      })
    );

    if (output === undefined || output === null) {
      jobService.updatePipelineStep(stepId, {
        status: "failed",
        error: { message: `Plugin returned ${output === null ? 'null' : 'undefined'} output` },
        completedAt: new Date(),
      });
      return yield* Effect.fail(new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Plugin ${step.pluginName} returned ${output === null ? 'null' : 'undefined'} output`,
        // cause: new Error(`Expected object output, got ${output === null ? 'null' : 'undefined'}`)
      }));
    }

    const validatedOutput = yield* SchemaValidator.validate(
      pluginMeta.outputSchema,
      output as Record<string, unknown>,
      `Step "${step.stepId}" output for plugin "${step.pluginName}`
    );

    if (!validatedOutput.success) {
      const error = new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Plugin ${step.pluginName} execution failed`,
        context: {
          errors: validatedOutput.errors,
        }
      });
      jobService.updatePipelineStep(stepId, {
        status: "failed",
        error,
        completedAt: new Date(),
      });
      return yield* Effect.fail(error);
    }

    const completedAt = new Date();
    
    yield* jobService.updatePipelineStep(stepId, {
      status: "completed",
      output: validatedOutput,
      completedAt,
    });

    // Update Redis state with completion
    yield* stateService.set(redisStepKey, {
      stepId,
      runId: context.runId,
      itemIndex: context.itemIndex,
      sourceJobId: context.sourceJobId,
      jobId: context.jobId,
      pluginName: step.pluginName,
      config: step.config,
      input,
      output: validatedOutput,
      status: "completed",
      startedAt: startTime,
      completedAt,
    }).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Failed to update step completion state in Redis: ${error.message}`,
        cause: error,
      }))
    );

    return validatedOutput;
  }).pipe(
    Effect.withSpan(`pipeline-step-${step.stepId}`, {
      attributes: {
        pluginName: step.pluginName,
        stepId: step.stepId,
      },
    })
  );
