import { z } from "zod";
import type { JSONSchemaType } from "ajv/dist/2020";

// ============================================================================
// PIPELINE SCHEMAS
// ============================================================================

// Pipeline step schema for runtime execution
export const runtimePipelineStepSchema = z.object({
  pluginName: z.string(),
  config: z.record(z.string(), z.unknown()),
  stepId: z.string(),
});

// Pipeline schema for runtime execution
export const runtimePipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(runtimePipelineStepSchema),
});

// Plugin metadata schema
export const pluginMetadataSchema = z.object({
  remoteUrl: z.string(),
  type: z.enum(["transformer", "distributor", "source"]).optional(),
  configSchema: z.any(), // JSONSchemaType<any>
  inputSchema: z.any(), // JSONSchemaType<any>
  outputSchema: z.any(), // JSONSchemaType<any>
  version: z.string().optional(),
  description: z.string().optional(),
});

// Plugin registry schema
export const pluginRegistrySchema = z.record(z.string(), pluginMetadataSchema);

// Pipeline execution context schema
export const pipelineExecutionContextSchema = z.object({
  runId: z.string(),
  itemIndex: z.number(),
  sourceJobId: z.string(),
  jobId: z.string(),
  env: z.object({
    secrets: z.array(z.string()),
  }),
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type RuntimePipelineStep = z.infer<typeof runtimePipelineStepSchema>;
export type RuntimePipeline = z.infer<typeof runtimePipelineSchema>;
export type RuntimePluginType = "transformer" | "distributor" | "source";

export interface PluginMetadata {
  remoteUrl: string;
  type?: RuntimePluginType;
  configSchema: JSONSchemaType<any>;
  inputSchema: JSONSchemaType<any>;
  outputSchema: JSONSchemaType<any>;
  version?: string;
  description?: string;
}

export interface PluginRegistry {
  [pluginName: string]: PluginMetadata;
}

export type PipelineExecutionContext = z.infer<typeof pipelineExecutionContextSchema>;
