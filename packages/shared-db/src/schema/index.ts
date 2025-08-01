import * as auth from "./auth";
import * as workflow from "./workflow";
import * as workflowRun from "./workflow-run";
import * as sourceItem from "./source-item";
import * as pluginRun from "./plugin-run";

export const schema = {
  ...auth,
  ...workflow,
  ...workflowRun,
  ...sourceItem,
  ...pluginRun,
};

export * from "./auth";
export * from "./workflow";
export * from "./workflow-run";
export * from "./source-item";
export * from "./plugin-run";

export type DB = typeof schema;
