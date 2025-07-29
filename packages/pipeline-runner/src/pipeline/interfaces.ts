import type { Config, Input, Output, Plugin } from "@usersdotfun/core-sdk";

export type PipelinePlugin = Plugin<Input<any>, Output<any>, Config>;
export interface PipelineExecutionContext {
  runId: string;
  itemIndex: number;
  sourceJobId: string;
  jobId: string;
  env: {
    secrets: string[];
  };
}