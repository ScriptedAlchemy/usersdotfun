import { Effect } from "effect";
import { PluginError, type StepError } from "./errors";
import type { PipelineStep } from "./interfaces";
import { getPlugin, PluginLoaderTag } from "./services";
import { SchemaValidator } from "./validation";

export const executeStep = (
  step: PipelineStep,
  input: Record<string, unknown>
): Effect.Effect<Record<string, unknown>, StepError, PluginLoaderTag> =>
  Effect.gen(function* () {
    const loadPlugin = yield* PluginLoaderTag;
    const pluginMeta = yield* getPlugin(step.pluginName);

    const validatedConfig = yield* SchemaValidator.validate(
      pluginMeta.configSchema,
      step.config,
      `Step "${step.stepId}" config for plugin "${step.pluginName}`
    );

    const plugin = yield* loadPlugin(step.pluginName, validatedConfig, pluginMeta.version);

    const validatedInput = yield* SchemaValidator.validate(
      pluginMeta.inputSchema,
      input,
      `Step "${step.stepId}" input for plugin "${step.pluginName}`
    );

    const output = yield* Effect.tryPromise({
      try: () => plugin.execute({ input: validatedInput }),
      catch: (error) =>
        new PluginError({
          pluginName: step.pluginName,
          cause: error,
          operation: "execute",
          message: `Failed to execute plugin ${step.pluginName}`,
        }),
    });

    if (output === undefined || output === null) {
      return yield* Effect.fail(new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Plugin ${step.pluginName} returned ${output === null ? 'null' : 'undefined'} output`,
        cause: new Error(`Expected object output, got ${output === null ? 'null' : 'undefined'}`)
      }));
    }

    const validatedOutput = yield* SchemaValidator.validate(
      pluginMeta.outputSchema,
      output as Record<string, unknown>,
      `Step "${step.stepId}" output for plugin "${step.pluginName}`
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
