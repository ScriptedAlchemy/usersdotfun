import * as auth from "./auth";
import * as workflow from "./workflow";
import * as workflowRun from "./workflow-run";
import * as sourceItem from "./source-item";
import * as pipelineStep from "./pipeline-step";

export const schema = {
  ...auth,
  ...workflow,
  ...workflowRun,
  ...sourceItem,
  ...pipelineStep,
};

export * from "./auth";
export * from "./workflow";
export * from "./workflow-run";
export * from "./source-item";
export * from "./pipeline-step";

export type DB = typeof schema;
