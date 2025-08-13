import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import {
  RssConfig,
  RssConfigSchema,
  RssInput,
  RssInputSchema,
  RssOutput,
  RssOutputSchema,
} from './schemas';

export default class RssPlugin
  implements
    Plugin<
      typeof RssInputSchema,
      typeof RssOutputSchema,
      typeof RssConfigSchema
    >
{
  readonly id = '@curatedotfun/rss' as const;
  readonly type = 'distributor' as const;
  readonly inputSchema = RssInputSchema;
  readonly outputSchema = RssOutputSchema;
  readonly configSchema = RssConfigSchema;

  private config: RssConfig | null = null;

  initialize(config: RssConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Initializing RSS plugin', { pluginId: self.id });

      if (!config.variables?.serviceUrl || !config.variables?.feedId || !config.variables?.feedConfig) {
        return yield* Effect.fail(new ConfigurationError('RSS plugin requires serviceUrl, feedId, and feedConfig'));
      }
      if (!config.secrets?.apiSecret) {
        return yield* Effect.fail(new ConfigurationError('RSS plugin requires an API secret'));
      }

      const { serviceUrl, feedId, feedConfig } = config.variables;
      const { apiSecret } = config.secrets;

      // Normalize service URL
      const normalizedServiceUrl = serviceUrl.endsWith('/')
        ? serviceUrl.slice(0, -1)
        : serviceUrl;

      // Validate service URL format
      try {
        new URL(normalizedServiceUrl);
      } catch (error) {
        return yield* Effect.fail(new ConfigurationError(`Invalid service URL: ${serviceUrl}`));
      }

      // Store normalized config
      self.config = {
        ...config,
        variables: {
          ...config.variables,
          serviceUrl: normalizedServiceUrl,
        },
      };

      yield* logger.logDebug('Performing RSS service health check', { 
        serviceUrl: normalizedServiceUrl 
      });

      // Health check
      const healthResponse = yield* Effect.tryPromise({
        try: () => fetch(`${normalizedServiceUrl}/health`),
        catch: (error) => new ConfigurationError(
          `Failed to connect to RSS service: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      });

      if (!healthResponse.ok) {
        return yield* Effect.fail(new ConfigurationError(
          `RSS service health check failed (status: ${healthResponse.status})`
        ));
      }

      yield* logger.logDebug('RSS service health check passed');

      // Setup feed configuration
      yield* logger.logDebug('Setting up feed configuration', { feedId });

      const configToSend = feedConfig;

      const configResponse = yield* Effect.tryPromise({
        try: () => fetch(`${normalizedServiceUrl}/api/feeds/${feedId}/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiSecret}`,
          },
          body: JSON.stringify(configToSend),
        }),
        catch: (error) => new ConfigurationError(
          `Failed to setup RSS feed configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      });

      if (!configResponse.ok) {
        const errorText = yield* Effect.tryPromise({
          try: () => configResponse.text(),
          catch: () => new ConfigurationError('Failed to read error response'),
        });
        return yield* Effect.fail(new ConfigurationError(
          `Failed to setup RSS feed configuration (status: ${configResponse.status}): ${errorText}`
        ));
      }

      const responseData = yield* Effect.tryPromise({
        try: () => configResponse.json(),
        catch: () => new ConfigurationError('Failed to parse configuration response'),
      });

      const wasCreated = responseData?.created;
      yield* logger.logDebug(
        wasCreated ? 'RSS feed created successfully' : 'RSS feed configuration updated successfully',
        { feedId }
      );

      yield* logger.logDebug('RSS plugin initialized successfully', {
        pluginId: self.id,
        feedId,
      });
    });
  }

  execute(input: RssInput): Effect.Effect<RssOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.config) {
        yield* logger.logError('Plugin not initialized', new Error('Call initialize() first'));
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized. Call initialize() first.', false));
      }

      yield* logger.logDebug('Executing RSS plugin', { pluginId: self.id });

      if (!self.config.variables || !self.config.secrets) {
        yield* logger.logError('Plugin configuration is invalid', new Error('Missing variables or secrets'));
        return yield* Effect.fail(new PluginExecutionError('Plugin configuration is invalid', false));
      }

      const { serviceUrl, feedId } = self.config.variables;
      const { apiSecret } = self.config.secrets;

      // Direct passthrough to RSS service
      const response = yield* Effect.tryPromise({
        try: () => fetch(`${serviceUrl}/api/feeds/${feedId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiSecret}`,
          },
          body: JSON.stringify(input),
        }),
        catch: (error) => new PluginExecutionError(
          `Network error calling RSS service: ${error instanceof Error ? error.message : 'Unknown error'}`,
          true
        ),
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new PluginExecutionError(
            `Failed to parse success response: ${error instanceof Error ? error.message : 'Unknown error'}`,
            false
          ),
        });

        yield* logger.logDebug('Successfully saved RSS item', { 
          feedId, 
          itemId: responseData.id 
        });

        return {
          success: true,
          data: {
            itemId: responseData.id || 'unknown',
            feedId,
            message: 'Item added successfully',
          },
        };
      }

      if (response.status === 409) {
        const responseData = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new PluginExecutionError(
            `Failed to parse conflict response: ${error instanceof Error ? error.message : 'Unknown error'}`,
            false
          ),
        });

        yield* logger.logDebug('Item already exists in feed, skipping', { 
          feedId, 
          itemId: responseData.id 
        });

        return {
          success: true,
          data: {
            itemId: responseData.id || 'unknown',
            feedId,
            message: 'Item already exists (skipped)',
          },
        };
      }

      if (response.status === 404) {
        yield* logger.logError('Feed not found', new Error(`Feed with ID '${feedId}' does not exist`));
        return yield* Effect.fail(new PluginExecutionError(
          `Feed with ID '${feedId}' does not exist`,
          false
        ));
      }

      const errorText = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: (error) => new PluginExecutionError(
          `Failed to read error response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          false
        ),
      });

      yield* logger.logError('RSS service error', new Error(`HTTP ${response.status}: ${errorText}`));
      return yield* Effect.fail(new PluginExecutionError(
        `Failed to save item to RSS service (status: ${response.status}): ${errorText}`,
        response.status >= 500 // Server errors are retryable
      ));
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Shutting down RSS plugin', { pluginId: self.id });
      self.config = null;
    });
  }
}
