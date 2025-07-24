import type { Config, Input, Output, Plugin } from "@usersdotfun/core-sdk";
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

export type PipelinePlugin = Plugin<Input<any>, Output<any>, Config>;

export interface PluginRegistry {
  [pluginName: string]: PluginMetadata;
}
