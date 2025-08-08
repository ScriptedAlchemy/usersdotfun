import {
  createConfigSchema,
  createInputSchema,
  createOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

// Schema for individual schema properties (for structured outputs)
const SchemaPropertySchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array']),
  description: z.string(),
});

export const AITransformerConfigSchema = createConfigSchema(
  z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    apiKey: z.string().min(1, 'API key is required'),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    schema: z.record(z.string(), SchemaPropertySchema).optional(),
  })
);

export const AITransformerInputSchema = createInputSchema(
  z.object({
    content: z.union([z.string(), z.record(z.string(), z.unknown())]),
  })
);

export const AITransformerOutputSchema = createOutputSchema(
  z.union([
    z.string(),
    z.record(z.string(), z.unknown()),
  ])
);

// Inferred types
export type AITransformerConfig = z.infer<typeof AITransformerConfigSchema>;
export type AITransformerInput = z.infer<typeof AITransformerInputSchema>;
export type AITransformerOutput = z.infer<typeof AITransformerOutputSchema>;
