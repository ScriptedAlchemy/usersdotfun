import { z } from "zod";

export const SimpleTransformSchemas = {
  config: z.object({
    multiplier: z.number().default(1),
    prefix: z.string().optional(),
  }),
  input: z.object({
    value: z.number(),
    message: z.string(),
  }),
  output: z.object({
    result: z.number(),
    processedMessage: z.string(),
    timestamp: z.string(),
  }),
};

export const SimpleTransformJsonSchemas = {
  config: z.toJSONSchema(SimpleTransformSchemas.config),
  input: z.toJSONSchema(SimpleTransformSchemas.input),
  output: z.toJSONSchema(SimpleTransformSchemas.output),
} as const;
