import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
  createConfigSchema,
  createSourceInputSchema,
  createSourceOutputSchema,
  PlatformStateSchema,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import { z } from 'zod';
import { RssItemSchema, type RssItem } from '@curatedotfun/rss-service/api';
import { XMLParser } from 'fast-xml-parser';

// RSS Source State Schema (specific to this plugin)
const RssSourceStateSchema = z.object({
  lastProcessedItemGuid: z.string().optional(),
  lastProcessedItemTimestamp: z.string().datetime().optional(),
  feedEtag: z.string().optional(),
  lastModified: z.string().optional(),
});

type RssSourceState = z.infer<typeof RssSourceStateSchema>;

// =============================================================================
// SOURCE PLUGIN SCHEMAS
// =============================================================================
const SourceConfigSchema = createConfigSchema(
  // Variables
  z.object({
    feedUrl: z.url(),
    maxItems: z.number().min(1).max(100).default(50),
    timeout: z.number().min(1000).max(30000).default(10000),
    pollInterval: z.number().min(60).max(86400).default(300), // 5 minutes
  }),
  // Secrets (for authenticated feeds)
  z.object({
    authToken: z.string().optional(),
  })
);

const SourceInputSchema = createSourceInputSchema(
  z.object({}), // No search options needed
  PlatformStateSchema.extend({
    rssState: RssSourceStateSchema.optional(),
  })
);

const SourceOutputSchema = createSourceOutputSchema(
  RssItemSchema,
  PlatformStateSchema.extend({
    rssState: RssSourceStateSchema,
  })
);

// =============================================================================
// RSS SOURCE PLUGIN
// =============================================================================
export default class RssSourcePlugin implements Plugin<
  typeof SourceInputSchema,
  typeof SourceOutputSchema, 
  typeof SourceConfigSchema
> {
  readonly id = '@curatedotfun/rss-source' as const;
  readonly type = 'source' as const;
  readonly inputSchema = SourceInputSchema;
  readonly outputSchema = SourceOutputSchema;
  readonly configSchema = SourceConfigSchema;

  private config: z.infer<typeof SourceConfigSchema> | null = null;

  initialize(config: z.infer<typeof SourceConfigSchema>) {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Initializing RSS source plugin', { 
        feedUrl: config.variables?.feedUrl 
      });

      // Validate feed URL
      yield* Effect.tryPromise({
        try: () => fetch(config.variables!.feedUrl, { method: 'HEAD' }),
        catch: (error) => new ConfigurationError(`Cannot reach RSS feed: ${error}`)
      });

      self.config = config;
      yield* logger.logDebug('RSS source plugin ready');
    });
  }

  execute(input: z.infer<typeof SourceInputSchema>) {
    const self = this;
    return Effect.gen(function* () {
      if (!self.config) {
        return yield* Effect.fail(new PluginExecutionError('Not initialized', false));
      }

      const logger = yield* PluginLoggerTag;
      const { feedUrl, maxItems, timeout } = self.config.variables!;
      const lastState = input.lastProcessedState?.data?.rssState;

      yield* logger.logDebug('Fetching RSS feed', { feedUrl, maxItems });

      // Fetch with conditional headers for efficiency
      const headers: Record<string, string> = {
        'User-Agent': 'RSS Source Plugin/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      };

      if (lastState?.feedEtag) headers['If-None-Match'] = lastState.feedEtag;
      if (lastState?.lastModified) headers['If-Modified-Since'] = lastState.lastModified;
      if (self.config.secrets?.authToken) headers['Authorization'] = `Bearer ${self.config.secrets.authToken}`;

      const response = yield* Effect.tryPromise({
        try: () => fetch(feedUrl, { 
          headers, 
          signal: AbortSignal.timeout(timeout) 
        }),
        catch: (error) => new PluginExecutionError(`Fetch failed: ${error}`, true)
      });

      // Handle 304 Not Modified
      if (response.status === 304) {
        yield* logger.logDebug('Feed not modified, no new items');
        return {
          success: true,
          data: {
            items: [],
            nextLastProcessedState: {
              rssState: lastState!,
              latestProcessedId: lastState?.lastProcessedItemGuid,
            }
          }
        };
      }

      if (!response.ok) {
        return yield* Effect.fail(new PluginExecutionError(
          `HTTP ${response.status}`, 
          response.status >= 500
        ));
      }

      // Parse RSS feed
      const xmlText = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: () => new PluginExecutionError('Failed to read response', false)
      });

      const { items: parsedItems } = yield* self.parseRssFeed(xmlText);

      // Filter new items based on state
      let newItems = parsedItems;
      if (lastState?.lastProcessedItemGuid) {
        const lastIndex = parsedItems.findIndex(
          (item: RssItem) => item.guid === lastState.lastProcessedItemGuid
        );
        if (lastIndex >= 0) {
          newItems = parsedItems.slice(0, lastIndex);
        }
      }

      // Limit items
      const limitedItems = newItems.slice(0, maxItems);

      // Transform to platform format
      const pluginItems = limitedItems.map((item: RssItem) => ({
        externalId: item.guid || item.link,
        content: item.content,
        contentType: 'article' as const,
        createdAt: item.publishedAt || new Date().toISOString(),
        url: item.link,
        authors: item.author ? [{ displayName: item.author }] : undefined,
        raw: item,
      }));

      // Update state
      const nextState: RssSourceState = {
        lastProcessedItemGuid: limitedItems[0]?.guid,
        lastProcessedItemTimestamp: limitedItems[0]?.publishedAt,
        feedEtag: response.headers.get('etag') || undefined,
        lastModified: response.headers.get('last-modified') || undefined,
      };

      yield* logger.logDebug('Processed RSS feed', { 
        newItems: limitedItems.length,
        totalItems: parsedItems.length 
      });

      return {
        success: true,
        data: {
          items: pluginItems,
          nextLastProcessedState: {
            rssState: nextState,
            latestProcessedId: limitedItems[0]?.guid,
          }
        }
      };
    });
  }

  private parseRssFeed(xmlText: string) {
    return Effect.gen(function* () {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: false,
        trimValues: true,
      });

      let parsedXml: any;
      try {
        parsedXml = parser.parse(xmlText);
      } catch (error) {
        return yield* Effect.fail(new PluginExecutionError(`Invalid XML format: ${error}`, false));
      }

      const items: RssItem[] = [];
      
      // Handle RSS format
      const rssItems = parsedXml?.rss?.channel?.item || [];
      const rssItemsArray = Array.isArray(rssItems) ? rssItems : [rssItems];
      
      // Handle Atom format
      const atomEntries = parsedXml?.feed?.entry || [];
      const atomEntriesArray = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
      
      // Process RSS items
      for (const item of rssItemsArray) {
        if (!item) continue;
        
        const title = item.title || '';
        const link = item.link || '';
        const content = item['content:encoded'] || item.description || '';
        const guid = item.guid?.['#text'] || item.guid || link;
        const pubDate = item.pubDate;
        const author = item.author || item['dc:creator'];
        const categories = Array.isArray(item.category) 
          ? item.category.map((cat: any) => typeof cat === 'string' ? cat : cat['#text']).filter(Boolean)
          : item.category ? [typeof item.category === 'string' ? item.category : item.category['#text']].filter(Boolean) : [];

        if (title || content) {
          items.push({
            id: guid,
            title,
            content,
            link,
            guid,
            author,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            categories,
          });
        }
      }
      
      // Process Atom entries
      for (const entry of atomEntriesArray) {
        if (!entry) continue;
        
        const title = entry.title?.['#text'] || entry.title || '';
        const link = entry.link?.['@_href'] || entry.link || '';
        const content = entry.content?.['#text'] || entry.summary?.['#text'] || entry.content || entry.summary || '';
        const guid = entry.id || link;
        const pubDate = entry.published || entry.updated;
        const author = entry.author?.name || entry.author;
        const categories = Array.isArray(entry.category) 
          ? entry.category.map((cat: any) => cat['@_term'] || cat).filter(Boolean)
          : entry.category ? [entry.category['@_term'] || entry.category].filter(Boolean) : [];

        if (title || content) {
          items.push({
            id: guid,
            title,
            content,
            link,
            guid,
            author,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            categories,
          });
        }
      }

      // Sort by date (newest first)
      items.sort((a, b) => 
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
      );

      return { items };
    });
  }

  shutdown() {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Shutting down RSS source plugin');
      self.config = null;
    });
  }
}
