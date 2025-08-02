
export interface PipelineExecutionContext {
  runId: string;
  itemIndex: number;
  sourceJobId: string;
  workflowId: string;
  env: {
    secrets: string[];
  };
}