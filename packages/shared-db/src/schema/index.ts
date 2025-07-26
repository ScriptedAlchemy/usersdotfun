export * from "./jobs";
export * from "./pipeline-steps";

export {
  selectJobSchema,
  insertJobSchema,
  updateJobSchema,
  type SelectJob,
  type InsertJobData,
  type UpdateJobData,
} from "./jobs";

export {
  selectPipelineStepSchema,
  insertPipelineStepSchema,
  updatePipelineStepSchema,
  type SelectPipelineStep,
  type InsertPipelineStepData,
  type UpdatePipelineStepData,
} from "./pipeline-steps";

import * as jobs from "./jobs";
import * as pipelineSteps from "./pipeline-steps";

export const schema = { ...jobs, ...pipelineSteps };

export type DB = typeof schema;

