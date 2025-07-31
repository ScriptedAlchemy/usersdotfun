import {
  createConfigSchema,
  createSourceInputSchema,
  createSourceOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

export const MasaSourceConfigSchema = createConfigSchema(
  // Variables
  z.object({
    baseUrl: z.url().optional(),
  }),
  // Secrets
  z.object({
    apiKey: z.string().min(1, "Masa API key is required"),
  })
);

// Schema for search options - based on SourcePluginSearchOptions
const MasaSearchOptionsSchema = z.object({
  type: z.string(), // e.g., "twitter-scraper", "reddit-scraper"
  query: z.string().optional(), // General query string
  pageSize: z.number().optional(), // General hint for how many items to fetch per request
  platformArgs: z.record(z.string(), z.unknown()).optional(), // Platform-specific arguments
}).catchall(z.unknown()); // Allow additional dynamic arguments

export const MasaSourceInputSchema = createSourceInputSchema(MasaSearchOptionsSchema);

// Schema for a single search result item from Masa - based on PluginSourceItem interface
const MasaPluginSourceItemSchema = z.object({
  // Required PluginSourceItem fields
  externalId: z.string(),
  content: z.string(),
  
  // Optional PluginSourceItem fields
  contentType: z.string().optional(), // Can be from ContentType enum or custom
  createdAt: z.string().optional(),
  url: z.string().optional(),
  authors: z.array(z.object({
    id: z.string().optional(),
    username: z.string().optional(),
    displayName: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
  
  // Raw data from Masa API
  raw: z.unknown(),
});

export const MasaSourceOutputSchema = createSourceOutputSchema(MasaPluginSourceItemSchema);
