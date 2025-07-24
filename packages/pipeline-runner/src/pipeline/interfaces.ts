import type { JSONSchemaType } from "ajv/dist/2020";

export interface Pipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
}

export interface PipelineStep {
  pluginName: string;
  config: Record<string, unknown>;
  stepId: string;
}

export interface PluginMetadata {
  remoteUrl: string;
  type?: PluginType;
  configSchema: JSONSchemaType<any>;
  inputSchema: JSONSchemaType<any>;
  outputSchema: JSONSchemaType<any>;
  version?: string;
  description?: string;
}

export type PluginType = "transformer" | "distributor" | "source";

export interface PipelinePlugin<TInput = unknown, TOutput = unknown, TConfig = unknown> {
  initialize(config: TConfig): Promise<void>;
  transform({ input }: { input: TInput }): Promise<TOutput>;
  shutdown?(): Promise<void>;
}

export interface PluginConfig<TConfig = unknown> {
  type: PluginType;
  url: string;
  config: TConfig;
  version?: string;
}

export interface PluginRegistry {
  [pluginName: string]: PluginMetadata;
}