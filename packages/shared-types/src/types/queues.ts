import { z } from "zod";
import {
  executePipelineJobDataSchema,
  jobDataSchema,
  jobStatusSchema,
  jobTypeEnum,
  queueStatusEnum,
  queueStatusSchema,
  startWorkflowRunJobDataSchema,
  sourceQueryJobDataSchema
} from '../schemas/queues';

// Enums
export type QueueStatusType = z.infer<typeof queueStatusEnum>;
export type JobType = z.infer<typeof jobTypeEnum>;

// Queue Management Types
export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;

// Queue Job Payload Types
export type StartWorkflowRunJobData = z.infer<typeof startWorkflowRunJobDataSchema>;
export type SourceQueryJobData = z.infer<typeof sourceQueryJobDataSchema>;
export type ExecutePipelineJobData = z.infer<typeof executePipelineJobDataSchema>;
export type JobData = z.infer<typeof jobDataSchema>;

// Queue Names
export const QUEUE_NAMES = {
  WORKFLOW_RUN: 'workflow-run-jobs',
  SOURCE_QUERY: 'source-query-jobs',
  PIPELINE_EXECUTION: 'pipeline-execution-jobs',
} as const;
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];