import {
  type QueueName,
  type StartWorkflowRunJobData,
  type ExecutePipelineJobData,
  QUEUE_NAMES
} from '@usersdotfun/shared-types/types';

export const VALID_QUEUE_NAMES = Object.values(QUEUE_NAMES);

export interface JobDataMapping {
  [QUEUE_NAMES.WORKFLOW_RUN]: StartWorkflowRunJobData;
  [QUEUE_NAMES.PIPELINE_EXECUTION]: ExecutePipelineJobData;
}

export type JobData = JobDataMapping[QueueName];
