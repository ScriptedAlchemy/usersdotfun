import { createConfigSchema, createSourceInputSchema, createSourceOutputSchema, PlatformStateSchema } from '@usersdotfun/core-sdk';
import { z } from 'zod';

// State schema for resumable operations (extends PlatformState)
export const RssSourceStateSchema = PlatformStateSchema.extend({
  lastProcessedItemGuid: z.string().optional(),
  lastProcessedItemTimestamp: z.string().datetime().optional(),
});

// Config schema with variables and secrets
export const RssSourceConfigSchema = createConfigSchema(
  // Variables (non-sensitive config)
  z.object({
    feedUrl: z.string().url(),
    maxItems: z.number().min(1).max(100).default(50).optional(),
    timeout: z.number().min(1000).max(30000).default(10000).optional(), // timeout in ms
  }),
  // Secrets (sensitive config, hydrated at runtime)
  z.object({
    // No secrets needed for basic RSS fetching, but could add API keys for protected feeds
  })
);

// Search options schema (empty for now as we're just fetching a single feed)
export const RssSourceSearchOptionsSchema = z.object({});

// Input schema for source plugin
export const RssSourceInputSchema = createSourceInputSchema(
  RssSourceSearchOptionsSchema,
  RssSourceStateSchema
);

// Individual RSS item schema for raw data
export const RssSourceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  description: z.string().optional(),
  link: z.string().url(),
  author: z.string().optional(),
  publishedAt: z.string().datetime(),
  guid: z.string(),
  categories: z.array(z.string()).optional(),
  image: z.string().url().optional(),
  source: z.object({
    url: z.string().url(),
    title: z.string(),
  }),
});

// Output schema for source plugin
export const RssSourceOutputSchema = createSourceOutputSchema(
  RssSourceItemSchema,
  RssSourceStateSchema
);

// Derived types
export type RssSourceState = z.infer<typeof RssSourceStateSchema>;
export type RssSourceConfig = z.infer<typeof RssSourceConfigSchema>;
export type RssSourceSearchOptions = z.infer<typeof RssSourceSearchOptionsSchema>;
export type RssSourceInput = z.infer<typeof RssSourceInputSchema>;
export type RssSourceItem = z.infer<typeof RssSourceItemSchema>;
export type RssSourceOutput = z.infer<typeof RssSourceOutputSchema>;
