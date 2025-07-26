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

import { jobsRelations } from "./jobs";
import { pipelineStepsRelations } from "./pipeline-steps";

export const relations = {
  ...jobsRelations,
  ...pipelineStepsRelations,
};
