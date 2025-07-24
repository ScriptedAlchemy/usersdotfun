import { z } from 'zod';

// Core schemas
export const ErrorDetailsSchema = z.object({
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
});

export const createOutputSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(), // Always required
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

export function createInputSchema(): z.ZodObject<{
  input: z.ZodUnknown;
  options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}>;
export function createInputSchema<I extends z.ZodTypeAny>(
  inputSchema: I
): z.ZodObject<{
  input: I;
  options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}>;
export function createInputSchema<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny
>(
  inputSchema: I,
  optionsSchema: O
): z.ZodObject<{
  input: I;
  options: z.ZodOptional<O>;
}>;
export function createInputSchema<
  I extends z.ZodTypeAny = z.ZodUnknown,
  O extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
>(inputSchema?: I, optionsSchema?: O) {
  return z.object({
    input: inputSchema ?? z.unknown(),
    options: (optionsSchema ?? z.record(z.string(), z.unknown())).optional(),
  });
}

// Convenience exports
export const BaseConfigSchema = createConfigSchema();
export const BaseInputSchema = createInputSchema();
export const BaseOutputSchema = createOutputSchema(z.unknown());

// Improved type definitions using conditional types
export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;

export type Config<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
> = z.infer<ReturnType<typeof createConfigSchema<V, S>>>;

export type Input<
  I extends z.ZodTypeAny = z.ZodUnknown,
  O extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
> = z.infer<ReturnType<typeof createInputSchema<I, O>>>;

export type Output<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createOutputSchema<T>>
>;

// More specific plugin interface
export interface Plugin<
  InputType = unknown,
  OutputType = unknown,
  ConfigType extends Config = Config
> {
  readonly type: 'transformer' | 'source' | 'destination';
  initialize(config?: ConfigType): Promise<void>;
  transform(input: Input<z.ZodType<InputType>>): Promise<Output<z.ZodType<OutputType>>>;
  shutdown(): Promise<void>;
}
