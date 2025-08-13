import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import {
  RssSourceConfig,
  RssSourceConfigSchema,
  RssSourceInput,
  RssSourceInputSchema,
  RssSourceOutput,
  RssSourceOutputSchema,
  RssSourceItem,
} from './schemas';

export default class RssSourcePlugin
  implements
    Plugin<
      typeof RssSourceInputSchema,
      typeof RssSourceOutputSchema,
      typeof RssSourceConfigSchema
    >
{
  readonly id = '@curatedotfun/rss-source' as const;
  readonly type = 'source' as const;
  readonly inputSchema = RssSourceInputSchema;
  readonly outputSchema = RssSourceOutputSchema;
  readonly configSchema = RssSourceConfigSchema;

  private config: RssSourceConfig | null = null;

  initialize(config: RssSourceConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Initializing RSS source plugin', { pluginId: self.id });

      if (!config.variables?.feedUrl) {
        return yield* Effect.fail(new ConfigurationError('RSS source plugin requires feedUrl'));
      }

      const { feedUrl, timeout = 10000 } = config.variables;

      // Validate feed URL format
      try {
        new URL(feedUrl);
      } catch (error) {
        return yield* Effect.fail(new ConfigurationError(`Invalid feed URL: ${feedUrl}`));
      }

      // Store config
      self.config = config;

      yield* logger.logDebug('Performing RSS feed health check', { feedUrl });

      // Health check - try to fetch the feed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const healthResponse = yield* Effect.tryPromise({
          try: () => fetch(feedUrl, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'RSS Source Plugin/1.0',
            },
          }),
          catch: (error) => new ConfigurationError(
            `Failed to connect to RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`
          ),
        });

        clearTimeout(timeoutId);

        if (!healthResponse.ok) {
          return yield* Effect.fail(new ConfigurationError(
            `RSS feed health check failed (status: ${healthResponse.status})`
          ));
        }

        yield* logger.logDebug('RSS feed health check passed');
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

      yield* logger.logDebug('RSS source plugin initialized successfully', {
        pluginId: self.id,
        feedUrl,
      });
    });
  }

  execute(input: RssSourceInput): Effect.Effect<RssSourceOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.config) {
        yield* logger.logError('Plugin not initialized', new Error('Call initialize() first'));
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized. Call initialize() first.', false));
      }

      yield* logger.logDebug('Executing RSS source plugin', { pluginId: self.id });

      const { feedUrl, maxItems = 50, timeout = 10000 } = self.config.variables!;
      const lastProcessedState = input.lastProcessedState?.data;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Fetch RSS feed
        const response = yield* Effect.tryPromise({
          try: () => fetch(feedUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'RSS Source Plugin/1.0',
              'Accept': 'application/rss+xml, application/xml, text/xml',
            },
          }),
          catch: (error) => new PluginExecutionError(
            `Network error fetching RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
          ),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return yield* Effect.fail(new PluginExecutionError(
            `Failed to fetch RSS feed (status: ${response.status})`,
            response.status >= 500
          ));
        }

        const xmlText = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) => new PluginExecutionError(
            `Failed to read RSS feed content: ${error instanceof Error ? error.message : 'Unknown error'}`,
            false
          ),
        });

        // Parse RSS feed
        const feedData = yield* self.parseRssFeed(xmlText, logger);
        
        // Filter items based on state (for resumable operations)
        let filteredItems = feedData.items;
        if (lastProcessedState?.lastProcessedItemGuid) {
          const lastIndex = filteredItems.findIndex(item => item.guid === lastProcessedState.lastProcessedItemGuid);
          if (lastIndex >= 0) {
            filteredItems = filteredItems.slice(0, lastIndex);
          }
        }

        // Limit items
        const limitedItems = filteredItems.slice(0, maxItems);

        // Transform to PluginSourceItem format
        const pluginSourceItems = limitedItems.map(item => ({
          externalId: item.guid,
          content: item.content,
          contentType: 'article',
          createdAt: item.publishedAt,
          url: item.link,
          authors: item.author ? [{ displayName: item.author }] : undefined,
          raw: item,
        }));

        // Update state
        const nextLastProcessedState = limitedItems.length > 0 ? {
          lastProcessedItemGuid: limitedItems[0].guid,
          lastProcessedItemTimestamp: limitedItems[0].publishedAt,
        } : lastProcessedState;

        yield* logger.logDebug('Successfully fetched RSS items', {
          feedTitle: feedData.title,
          totalItems: pluginSourceItems.length,
        });

        return {
          success: true,
          data: {
            items: pluginSourceItems,
            nextLastProcessedState,
          },
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  private parseRssFeed(xmlText: string, logger: any): Effect.Effect<{ title: string; description?: string; items: RssSourceItem[] }, PluginExecutionError, never> {
    return Effect.gen(function* () {
      try {
        // Simple XML parsing for RSS feeds
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');

        // Check for parsing errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          return yield* Effect.fail(new PluginExecutionError('Invalid XML format in RSS feed', false));
        }

        // Extract feed metadata
        const channel = doc.querySelector('channel');
        if (!channel) {
          return yield* Effect.fail(new PluginExecutionError('Invalid RSS format: no channel element found', false));
        }

        const feedTitle = channel.querySelector('title')?.textContent || 'Unknown Feed';
        const feedDescription = channel.querySelector('description')?.textContent;

        // Extract items
        const itemElements = Array.from(channel.querySelectorAll('item'));
        const items: RssSourceItem[] = [];

        for (const itemElement of itemElements) {
          const title = itemElement.querySelector('title')?.textContent || '';
          const link = itemElement.querySelector('link')?.textContent || '';
          const description = itemElement.querySelector('description')?.textContent || '';
          const content = itemElement.querySelector('content\\:encoded, content')?.textContent || description;
          const guid = itemElement.querySelector('guid')?.textContent || link || `${Date.now()}-${Math.random()}`;
          const pubDate = itemElement.querySelector('pubDate')?.textContent;
          const author = itemElement.querySelector('author, dc\\:creator')?.textContent;

          // Parse categories
          const categoryElements = Array.from(itemElement.querySelectorAll('category'));
          const categories = categoryElements.map(cat => cat.textContent || '').filter(Boolean);

          // Parse published date
          let publishedAt: string;
          if (pubDate) {
            try {
              publishedAt = new Date(pubDate).toISOString();
            } catch {
              publishedAt = new Date().toISOString();
            }
          } else {
            publishedAt = new Date().toISOString();
          }

          // Extract image
          const imageElement = itemElement.querySelector('enclosure[type^="image"], media\\:content[type^="image"]');
          const image = imageElement?.getAttribute('url') || undefined;

          if (title || content || description) {
            items.push({
              id: guid,
              title,
              content,
              description: description || undefined,
              link,
              author: author || undefined,
              publishedAt,
              guid,
              categories: categories.length > 0 ? categories : undefined,
              image,
              source: {
                url: feedTitle,
                title: feedTitle,
              },
            });
          }
        }

        // Sort items by published date (newest first)
        items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        return {
          title: feedTitle,
          description: feedDescription,
          items,
        };
      } catch (error) {
        return yield* Effect.fail(new PluginExecutionError(
          `Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          false
        ));
      }
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Shutting down RSS source plugin', { pluginId: self.id });
      self.config = null;
    });
  }
}
