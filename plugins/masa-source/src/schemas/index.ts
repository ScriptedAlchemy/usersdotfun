import {
  createConfigSchema,
  createSourceInputSchema,
  createSourceOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

// Search options schema
export const MasaSearchOptionsSchema = z.object({
  type: z.string(), // e.g., "twitter", "tiktok"
  query: z.string().optional(),
  pageSize: z.number().optional(),
  platformArgs: z.record(z.string(), z.unknown()).optional(),
  language: z.string().optional(),
}).catchall(z.unknown());

export const MasaPlatformStateSchema = z.object({
  latestProcessedId: z.string().optional(),
  currentAsyncJob: z.object({
    workflowId: z.string(),
    status: z.enum(["submitted", "pending", "processing", "done", "error", "timeout"]),
    submittedAt: z.string(),
    lastCheckedAt: z.string().optional(),
    errorMessage: z.string().optional(),
  }).nullable().optional(),
});

export const MasaSourceConfigSchema = createConfigSchema(
  z.object({
    baseUrl: z.url().optional(),
  }),
  z.object({
    apiKey: z.string().min(1, "Masa API key is required"),
  })
);

export const MasaApiResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string().optional(),
  metadata: z.object({
    created_at: z.string().optional(),
    url: z.string().optional(),
    username: z.string().optional(),
    user_id: z.string().optional(),
  }).catchall(z.unknown()).optional(),
}).catchall(z.unknown());

export const MasaSourceInputSchema = createSourceInputSchema(
  MasaSearchOptionsSchema,
  MasaPlatformStateSchema
);

export const MasaSourceOutputSchema = createSourceOutputSchema(
  MasaApiResponseSchema,
  MasaPlatformStateSchema
);

// Derived types
export type MasaSourceConfig = z.infer<typeof MasaSourceConfigSchema>;
export type MasaSearchOptions = z.infer<typeof MasaSearchOptionsSchema>;
export type MasaSourceInput = z.infer<typeof MasaSourceInputSchema>;
export type MasaSourceOutput = z.infer<typeof MasaSourceOutputSchema>;
