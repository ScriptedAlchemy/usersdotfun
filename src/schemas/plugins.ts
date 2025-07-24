import { z } from "zod";

export const SimpleTransformSchemas = {
  config: z.object({
    template: z.string().optional(),
  }),
  input: z.object({
    content: z.string(),
  }),
  output: z.object({
    result: z.string(),
  }),
};

export const SimpleTransformJsonSchemas = {
  config: z.toJSONSchema(SimpleTransformSchemas.config),
  input: z.toJSONSchema(SimpleTransformSchemas.input),
  output: z.toJSONSchema(SimpleTransformSchemas.output),
} as const;
