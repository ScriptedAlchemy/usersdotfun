import { z } from 'zod';

// Helpers
export const createOutputSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    errors: z.array(ErrorDetailsSchema).optional(),
  });

export function createConfigSchema(): z.ZodObject<{
  variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  secrets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}>;
export function createConfigSchema<V extends z.ZodTypeAny>(
  variablesSchema: V
): z.ZodObject<{
  variables: z.ZodOptional<V>;
  secrets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}>;
export function createConfigSchema<
  V extends z.ZodTypeAny,
  S extends z.ZodTypeAny
>(
  variablesSchema: V,
  secretsSchema: S
): z.ZodObject<{
  variables: z.ZodOptional<V>;
  secrets: z.ZodOptional<S>;
}>;
export function createConfigSchema<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
>(variablesSchema?: V, secretsSchema?: S) {
  return z.object({
    variables: (variablesSchema ?? z.record(z.string(), z.unknown())).optional(),
    secrets: (secretsSchema ?? z.record(z.string(), z.unknown())).optional(),
  });
}

export function createInputSchema<I extends z.ZodTypeAny>(
  inputSchema: I,
) {
  return z.object({
    input: inputSchema,
  });
}

// Core schemas
export const ErrorDetailsSchema = z.object({
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
});

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;

export type Config<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
> = z.infer<ReturnType<typeof createConfigSchema<V, S>>>;

export type Input<
  I extends z.ZodTypeAny
> = z.infer<ReturnType<typeof createInputSchema<I>>>;

export type Output<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createOutputSchema<T>>
>;

// Plugin interface
export interface Plugin<
  InputType extends Input<z.ZodAny>,
  OutputType extends Output<z.ZodAny>,
  ConfigType extends Config,
> {
  readonly type: 'transformer' | 'source' | 'destination';
  initialize(config?: ConfigType): Promise<void>;
  execute(input: InputType): Promise<OutputType>;
  shutdown(): Promise<void>;
}
