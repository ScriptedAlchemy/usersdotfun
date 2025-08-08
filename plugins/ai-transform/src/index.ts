import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import {
  AITransformerConfig,
  AITransformerConfigSchema,
  AITransformerInput,
  AITransformerInputSchema,
  AITransformerOutput,
  AITransformerOutputSchema,
} from './schemas';

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: string;
      properties: Record<string, any>;
      required: string[];
      additionalProperties: boolean;
    };
  };
}

export default class AITransformer
  implements
    Plugin<
      typeof AITransformerInputSchema,
      typeof AITransformerOutputSchema,
      typeof AITransformerConfigSchema
    >
{
  readonly id = '@curatedotfun/ai-transform' as const;
  readonly type = 'transformer' as const;
  readonly inputSchema = AITransformerInputSchema;
  readonly outputSchema = AITransformerOutputSchema;
  readonly configSchema = AITransformerConfigSchema;
  
  private config: AITransformerConfig | null = null;
  private responseFormat: ResponseFormat | null = null;

  initialize(config: AITransformerConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Initializing AI transformer plugin', { pluginId: self.id });

      if (!config.variables?.prompt) {
        return yield* Effect.fail(new ConfigurationError('AI transformer requires a prompt configuration'));
      }
      if (!config.secrets?.apiKey) {
        return yield* Effect.fail(new ConfigurationError('AI transformer requires an OpenRouter API key'));
      }

      self.config = config;

      // Set up response format for structured outputs
      if (config.variables.schema) {
        self.responseFormat = {
          type: "json_schema",
          json_schema: {
            name: "transformer",
            strict: true,
            schema: {
              type: "object",
              properties: config.variables.schema,
              required: Object.keys(config.variables.schema),
              additionalProperties: false,
            },
          },
        };
      }

      yield* logger.logDebug('AI transformer plugin initialized successfully', {
        pluginId: self.id,
        hasSchema: !!config.variables.schema,
        model: config.variables.model || (config.variables.schema ? "openai/gpt-4o-2024-08-06" : "openai/gpt-3.5-turbo"),
      });
    });
  }

  execute(
    input: AITransformerInput,
  ): Effect.Effect<AITransformerOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.config) {
        yield* logger.logError('Plugin not initialized', new Error('Call initialize() first'));
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized. Call initialize() first.', false));
      }

      yield* logger.logDebug('Executing AI transformer plugin', { pluginId: self.id });

      try {
        const messages: Message[] = [
          { role: "system", content: self.config.variables!.prompt },
          {
            role: "user",
            content: typeof input.content === "string" ? input.content : JSON.stringify(input.content),
          },
        ];

        const model = self.config.variables!.model || 
          (self.config.variables!.schema ? "openai/gpt-4o-2024-08-06" : "openai/gpt-3.5-turbo");
        
        const temperature = self.config.variables!.temperature ?? 0.7;

        const requestBody: any = {
          model,
          messages,
          temperature,
        };

        if (self.responseFormat) {
          requestBody.response_format = self.responseFormat;
        }

        yield* logger.logDebug('Making request to OpenRouter API', {
          model,
          temperature,
          hasResponseFormat: !!self.responseFormat,
        });

        const response = yield* Effect.tryPromise({
          try: () => fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${self.config!.secrets!.apiKey}`,
              "HTTP-Referer": "https://curate.fun",
              "X-Title": "CurateDotFun",
            },
            body: JSON.stringify(requestBody),
          }),
          catch: (error) => new PluginExecutionError(
            `Network error calling OpenRouter API: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
          ),
        });

        if (!response.ok) {
          const errorText = yield* Effect.tryPromise({
            try: () => response.text(),
            catch: () => new PluginExecutionError('Failed to read error response', false),
          });
          yield* logger.logError('OpenRouter API error', new Error(`HTTP ${response.status}: ${errorText}`));
          return yield* Effect.fail(new PluginExecutionError(
            `OpenRouter API error (${response.status}): ${errorText}`,
            response.status >= 500 // Server errors are retryable
          ));
        }

        const result = yield* Effect.tryPromise({
          try: () => response.json() as Promise<OpenRouterResponse>,
          catch: (error) => new PluginExecutionError(
            `Failed to parse OpenRouter API response: ${error instanceof Error ? error.message : 'Unknown error'}`,
            false
          ),
        });

        if (!result.choices?.[0]?.message?.content) {
          yield* logger.logError('Invalid response structure from OpenRouter API', new Error('Missing content in response'));
          return yield* Effect.fail(new PluginExecutionError('Invalid response structure from OpenRouter API', false));
        }

        const content = result.choices[0].message.content;

        let transformedData: string | Record<string, unknown>;

        if (self.responseFormat) {
          try {
            transformedData = JSON.parse(content);
            yield* logger.logDebug('Successfully parsed structured JSON response', { pluginId: self.id });
          } catch (error) {
            yield* logger.logError('Failed to parse JSON response', error instanceof Error ? error : new Error('Unknown parsing error'));
            return yield* Effect.fail(new PluginExecutionError(
              `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
              false
            ));
          }
        } else {
          transformedData = content;
          yield* logger.logDebug('Successfully processed text response', { pluginId: self.id });
        }

        return { success: true, data: transformedData };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        yield* logger.logError('AI transformation failed', error instanceof Error ? error : new Error(errorMessage));
        return yield* Effect.fail(new PluginExecutionError(`AI transformation failed: ${errorMessage}`, true));
      }
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Shutting down AI transformer plugin', { pluginId: self.id });
      self.config = null;
      self.responseFormat = null;
    });
  }
}
