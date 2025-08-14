import {
  ConfigurationError,
  PluginExecutionError,
  PluginLoggerTag,
  createConfigSchema,
  createInputSchema,
  createOutputSchema,
  type Plugin,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import { z } from 'zod';
import { createClient, FeedConfigSchema, RssItemSchema } from '@curatedotfun/rss-service/api';

// =============================================================================
// DISTRIBUTOR PLUGIN SCHEMAS
// =============================================================================
export const RssDistributorConfigSchema = createConfigSchema(
  // Variables
  z.object({
    serviceUrl: z.url(),
    feedId: z.string(),
    feedConfig: FeedConfigSchema.omit({ id: true }),
    autoCreateFeed: z.boolean().default(true),
  }),
  // Secrets
  z.object({
    apiSecret: z.string().min(1),
  })
);

export const RssDistributorInputSchema = createInputSchema(RssItemSchema);

export const RssDistributorOutputSchema = createOutputSchema(
  z.object({
    itemId: z.string(),
    feedId: z.string(),
    message: z.string(),
    feedUrls: z.object({
      json: z.string(),
      rss: z.string(),
      atom: z.string(),
    }).optional(),
  })
);

// =============================================================================
// RSS DISTRIBUTOR PLUGIN
// =============================================================================
export default class RssDistributorPlugin implements Plugin<
  typeof RssDistributorInputSchema,
  typeof RssDistributorOutputSchema,
  typeof RssDistributorConfigSchema
> {
  readonly id = '@curatedotfun/rss' as const;
  readonly type = 'distributor' as const;
  readonly inputSchema = RssDistributorInputSchema;
  readonly outputSchema = RssDistributorOutputSchema;
  readonly configSchema = RssDistributorConfigSchema;

  private client: ReturnType<typeof createClient> | null = null;
  private config: z.infer<typeof RssDistributorConfigSchema> | null = null;

  initialize(config: z.infer<typeof RssDistributorConfigSchema>) {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Initializing RSS distributor plugin');

      // Create typed HTTP client
      self.client = createClient(config.variables!.serviceUrl, config.secrets!.apiSecret);

      self.config = config;

      // Health check
      const healthResponse = yield* Effect.tryPromise({
        try: () => self.client!.health.$get(),
        catch: (error) => new ConfigurationError(`Service unavailable: ${error}`)
      });

      if (!healthResponse.ok) {
        return yield* Effect.fail(new ConfigurationError(`Service health check failed: ${healthResponse.status}`));
      }

      // Auto-create feed if enabled
      if (config.variables!.autoCreateFeed) {
        const feedConfig = {
          ...config.variables!.feedConfig,
          id: config.variables!.feedId,
        };

        const response = yield* Effect.tryPromise({
          try: () => self.client!.api.feeds.$post({ json: feedConfig }),
          catch: (error) => new ConfigurationError(`Feed creation failed: ${error}`)
        });

        if (response.ok) {
          yield* logger.logDebug('Feed created/updated', { feedId: config.variables!.feedId });
        }
      }

      yield* logger.logDebug('RSS distributor plugin ready', {
        serviceUrl: config.variables!.serviceUrl,
        feedId: config.variables!.feedId,
      });
    });
  }

  execute(input: z.infer<typeof RssDistributorInputSchema>) {
    const self = this;
    return Effect.gen(function* () {
      if (!self.client || !self.config) {
        return yield* Effect.fail(new PluginExecutionError('Not initialized', false));
      }

      const logger = yield* PluginLoggerTag;
      const { feedId, serviceUrl } = self.config.variables!;

      yield* logger.logDebug('Adding item to RSS feed', {
        feedId,
        itemTitle: input.title
      });

      // Add item to feed using fetch (Hono RPC client has complex typing for dynamic paths)
      const response = yield* Effect.tryPromise({
        try: () => fetch(`${serviceUrl}/api/feeds/${feedId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${self.config!.secrets!.apiSecret}`,
          },
          body: JSON.stringify(input),
        }),
        catch: (error) => new PluginExecutionError(`Request failed: ${error}`, true)
      });

      if (response.status === 409) {
        // Item already exists - that's ok for RSS feeds
        const data = yield* Effect.tryPromise({
          try: () => response.json() as Promise<{ id: string; feedId: string }>,
          catch: () => new PluginExecutionError('Invalid response', false)
        });

        yield* logger.logDebug('Item already exists, skipping', { itemId: data.id });

        return {
          success: true,
          data: {
            itemId: data.id,
            feedId: data.feedId,
            message: 'Item already exists (skipped)',
            feedUrls: {
              json: `${serviceUrl}/${feedId}/feed.json`,
              rss: `${serviceUrl}/${feedId}/rss.xml`,
              atom: `${serviceUrl}/${feedId}/atom.xml`,
            },
          },
        };
      }

      if (!response.ok) {
        return yield* Effect.fail(new PluginExecutionError(
          `HTTP ${response.status}`,
          response.status >= 500
        ));
      }

      const data = yield* Effect.tryPromise({
        try: () => response.json() as Promise<{ id: string; feedId: string; message: string }>,
        catch: () => new PluginExecutionError('Invalid response', false)
      });

      yield* logger.logDebug('Item added successfully', {
        itemId: data.id,
        feedId: data.feedId
      });

      return {
        success: true,
        data: {
          itemId: data.id,
          feedId: data.feedId,
          message: data.message,
          feedUrls: {
            json: `${serviceUrl}/${feedId}/feed.json`,
            rss: `${serviceUrl}/${feedId}/rss.xml`,
            atom: `${serviceUrl}/${feedId}/atom.xml`,
          },
        },
      };
    });
  }

  shutdown() {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Shutting down RSS distributor plugin');
      self.config = null;
    });
  }
}
