import {
  createConfigSchema,
  createSourceInputSchema,
  createSourceOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

// Search options schema
export const MasaSearchOptionsSchema = z.object({
  type: z.string(), // e.g., "twitter-scraper", "tiktok-transcription"
  query: z.string().optional(),
  pageSize: z.number().optional(),
  platformArgs: z.record(z.string(), z.unknown()).optional(),
  language: z.string().optional(),
}).catchall(z.unknown()); // Allow additional dynamic arguments

export const MasaSearchResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string().optional(),
  Metadata: z.object({
    created_at: z.string().optional(),
    url: z.string().optional(),
    username: z.string().optional(),
    user_id: z.string().optional(),
  }).catchall(z.unknown()).optional(),
}).catchall(z.unknown());

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

export const MasaSourceInputSchema = createSourceInputSchema(MasaSearchOptionsSchema);

export const MasaSourceOutputSchema = createSourceOutputSchema(MasaSearchResultSchema);

// Derived types
export type MasaSourceConfig = z.infer<typeof MasaSourceConfigSchema>;
export type MasaSourceInput = z.infer<typeof MasaSourceInputSchema>;
export type MasaSourceOutput = z.infer<typeof MasaSourceOutputSchema>;
