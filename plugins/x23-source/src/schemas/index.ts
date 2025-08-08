import {
  createConfigSchema,
  createSourceInputSchema,
  createSourceOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

// Search options schema for x23 source
export const X23SearchOptionsSchema = z.object({
  days: z.number().min(1).max(365).default(7).describe("Number of days to query from x23 API"),
  type: z.literal("x23").default("x23").describe("Platform type identifier"),
}).catchall(z.unknown());

// Platform-specific state for resumable operations
export const X23PlatformStateSchema = z.object({
  lastFetchTime: z.string().optional().describe("ISO timestamp of last successful fetch"),
  lastSuccessfulDays: z.number().optional().describe("Last successful days parameter used"),
});

// Configuration schema for the x23 source plugin
export const X23SourceConfigSchema = createConfigSchema(
  z.object({
    baseUrl: z.string().url().default('http://api.x23.ai').describe("Base URL for x23 API"),
    timeout: z.number().min(1000).max(120000).default(30000).describe("Request timeout in milliseconds"),
    userAgent: z.string().default('curate.fun x23-source-plugin').describe("User agent for HTTP requests"),
    maxRetries: z.number().min(0).max(5).default(2).describe("Maximum number of retry attempts"),
    minFetchInterval: z.number().min(60000).default(300000).describe("Minimum interval between fetches in milliseconds (5 minutes default)"),
  }),
  z.object({
    // No secrets needed for this public API
  })
);

// Schema for individual x23 CSV record
export const X23RecordSchema = z.object({
  Posted: z.string().describe("Posted date/time"),
  Title: z.string().describe("Grant/funding title"),
  Headline: z.string().describe("Grant/funding headline description"),
  'App URL': z.string().url().describe("x23 app URL"),
  'Original URL': z.string().url().describe("Original source URL"),
}).catchall(z.unknown());

// Input schema for the source plugin
export const X23SourceInputSchema = createSourceInputSchema(
  X23SearchOptionsSchema,
  X23PlatformStateSchema
);

// Output schema for the source plugin
export const X23SourceOutputSchema = createSourceOutputSchema(
  X23RecordSchema,
  X23PlatformStateSchema
);

// Derived TypeScript types
export type X23SourceConfig = z.infer<typeof X23SourceConfigSchema>;
export type X23SearchOptions = z.infer<typeof X23SearchOptionsSchema>;
export type X23SourceInput = z.infer<typeof X23SourceInputSchema>;
export type X23SourceOutput = z.infer<typeof X23SourceOutputSchema>;
export type X23PlatformState = z.infer<typeof X23PlatformStateSchema>;
export type X23Record = z.infer<typeof X23RecordSchema>;
