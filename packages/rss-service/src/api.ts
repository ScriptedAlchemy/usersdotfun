import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { hc } from 'hono/client';
import { Hono } from 'hono';

// =============================================================================
// SCHEMAS & TYPES
// =============================================================================
export const RssItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  description: z.string().optional(),
  link: z.url(),
  publishedAt: z.string().datetime().optional(),
  guid: z.string().optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).optional(),
  image: z.string().url().optional(),
});

export const FeedConfigSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  siteUrl: z.string().url(),
  maxItems: z.number().int().min(1).max(1000).default(100),
  language: z.string().default('en'),
  image: z.string().url().optional(),
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
  }).optional(),
});

export type RssItem = z.infer<typeof RssItemSchema>;
export type FeedConfig = z.infer<typeof FeedConfigSchema>;

// =============================================================================
// VALIDATORS (Used by the service, defined with the contract)
// =============================================================================
export const addItemValidator = zValidator('json', RssItemSchema);
export const createFeedValidator = zValidator('json', FeedConfigSchema);

// =============================================================================
// HONO RPC TYPE (The Core of the Contract)
// =============================================================================
// We define the routes here, and the service will implement them.
const routes = new Hono()
  .get('/health', (c) => c.json({} as { status: string; timestamp: string; service: string }))
  .post('/api/feeds', (c) => c.json({} as { feedId: string; message: string; created: string }))
  .post('/api/feeds/:feedId/items', (c) => c.json({} as { id: string; feedId: string; message: string }))
  .get('/api/feeds/:feedId/stats', (c) => c.json({} as Record<string, string>))
  .get('/api/feeds/:feedId/items', (c) => c.json({} as { items: RssItem[]; feedId: string; count: number }))
  .get('/:feedId/feed.json', (c) => c.json({} as { version: string; title: string; items: any[] }))
  .get('/:feedId/rss.xml', (c) => new Response(''));

export type AppType = typeof routes;

// =============================================================================
// CLIENT FACTORY (The entry point for plugins)
// =============================================================================
/**
 * Creates a type-safe RPC client for the RSS Service.
 * @param serviceUrl The base URL of the running RSS service.
 * @param apiSecret The API secret for authentication.
 */
export const createClient = (serviceUrl: string, apiSecret: string) => {
  return hc<AppType>(serviceUrl, {
    headers: {
      'Authorization': `Bearer ${apiSecret}`,
    },
  });
};
