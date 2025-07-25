import {
  createConfigSchema,
  createInputSchema,
  createOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

export const MasaSourceConfigSchema = createConfigSchema(
  // Variables
  z.object({
    baseUrl: z.string().url().optional(),
  }),
  // Secrets
  z.object({
    apiKey: z.string().min(1, "Masa API key is required"),
  })
);

export const MasaSourceInputSchema = createInputSchema(
  z.object({
    searchOptions: z.record(z.string(), z.unknown()),
    lastProcessedState: z.record(z.string(), z.unknown()).optional().nullable(),
  })
);

// Schema for a single search result item from Masa
const MasaSearchResultItemSchema = z.object({
  ID: z.string(),
  ExternalID: z.string(),
  Content: z.string(),
  Metadata: z.record(z.string(), z.unknown()),
});

export const MasaSourceOutputSchema = createOutputSchema(
  z.object({
    items: z.array(MasaSearchResultItemSchema),
    nextLastProcessedState: z.record(z.string(), z.unknown()).optional().nullable(),
  })
);
