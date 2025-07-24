import {
  createConfigSchema,
  createInputSchema,
  createOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

export const SimpleTransformerConfigSchema = createConfigSchema(
  z.object({ template: z.string() })
);

export const SimpleTransformerInputSchema = createInputSchema(
  z.object({ content: z.string() })
);

export const SimpleTransformerOutputSchema = createOutputSchema(z.string());
