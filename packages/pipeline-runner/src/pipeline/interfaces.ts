import type { Config, Input, Output, Plugin } from "@usersdotfun/core-sdk";
import type { 
  RuntimePipeline, 
  RuntimePipelineStep, 
  PipelineExecutionContext, 
  PluginMetadata, 
  PluginRegistry, 
  RuntimePluginType 
} from "@usersdotfun/shared-types";

export type PipelinePlugin = Plugin<Input<any>, Output<any>, Config>;

// Re-export types for backward compatibility
export type { 
  RuntimePipeline as Pipeline, 
  RuntimePipelineStep as PipelineStep, 
  PipelineExecutionContext, 
  PluginMetadata, 
  PluginRegistry, 
  RuntimePluginType as PluginType 
};
