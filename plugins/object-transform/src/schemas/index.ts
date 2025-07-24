import {
  createConfigSchema,
  createInputSchema,
  createOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

const MappingValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([z.string(), z.array(z.string()), z.record(z.string(), MappingValueSchema)]),
);

export const ObjectTransformerConfigSchema = createConfigSchema(
  z.object({
    mappings: z.record(z.string(), MappingValueSchema),
  }),
);

export const ObjectTransformerInputSchema = createInputSchema(
  z.record(z.string(), z.unknown()),
);

export const ObjectTransformerOutputSchema = createOutputSchema(
  z.record(z.string(), z.unknown()),
);
