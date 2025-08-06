import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import Mustache from 'mustache';
import {
  SimpleTransformerConfig,
  SimpleTransformerConfigSchema,
  SimpleTransformerInput,
  SimpleTransformerInputSchema,
  SimpleTransformerOutput,
  SimpleTransformerOutputSchema,
} from './schemas';

export default class SimpleTransformer
  implements
    Plugin<
      typeof SimpleTransformerInputSchema,
      typeof SimpleTransformerOutputSchema,
      typeof SimpleTransformerConfigSchema
    >
{
  readonly id = '@curatedotfun/simple-transform' as const;
  readonly type = 'transformer' as const;
  readonly inputSchema = SimpleTransformerInputSchema;
  readonly outputSchema = SimpleTransformerOutputSchema;
  readonly configSchema = SimpleTransformerConfigSchema;
  private template: string = '{{content}}'; // Simple default template

  initialize(config: SimpleTransformerConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Initializing Simple transformer plugin', { pluginId: self.id });
      if (config?.variables?.template) {
        self.template = config.variables.template;
      }
      yield* Effect.void;
    });
  }

  execute(
    input: SimpleTransformerInput,
  ): Effect.Effect<SimpleTransformerOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Executing Simple transformer plugin', { pluginId: self.id });
      try {
        const result = Mustache.render(self.template, input);
        return { success: true, data: { content: result } };
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        yield* logger.logError('Error executing Simple transformer plugin', err);
        return yield* Effect.fail(new PluginExecutionError(err.message, false));
      }
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Shutting down Simple transformer plugin', { pluginId: self.id });
    });
  }
}
