import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import {
  TemplateConfig,
  TemplateConfigSchema,
  TemplateInput,
  TemplateInputSchema,
  TemplateOutput,
  TemplateOutputSchema,
} from './schemas';

export class TemplatePlugin
  implements Plugin<
    typeof TemplateInputSchema,
    typeof TemplateOutputSchema,
    typeof TemplateConfigSchema
  > {
  readonly id = '@curatedotfun/template-plugin' as const;
  readonly type = 'transformer' as const; // Change to 'distributor' if needed
  readonly inputSchema = TemplateInputSchema;
  readonly outputSchema = TemplateOutputSchema;
  readonly configSchema = TemplateConfigSchema;

  private config: TemplateConfig | null = null;

  initialize(config: TemplateConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!config?.secrets?.apiKey) {
        const error = new ConfigurationError('API key is required.');
        yield* logger.logError('Configuration error: API key is missing.', error);
        return yield* Effect.fail(error);
      }

      self.config = config;
      yield* logger.logInfo('Template plugin initialized successfully', { pluginId: self.id });
    });
  }

  execute(input: TemplateInput): Effect.Effect<TemplateOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.config) {
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized', false));
      }

      yield* logger.logDebug('Executing template plugin', { 
        pluginId: self.id,
        query: input.query 
      });

      try {
        // TODO: Implement your plugin logic here
        const results = [
          { id: '1', content: `Processed: ${input.query}` },
          { id: '2', content: 'Example result' }
        ];

        return {
          success: true,
          data: {
            results,
            count: results.length,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        yield* logger.logError('Failed to execute template plugin', error);
        return yield* Effect.fail(new PluginExecutionError(errorMessage, true));
      }
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Shutting down template plugin', { pluginId: self.id });
      self.config = null;
    });
  }
}

export default TemplatePlugin;
