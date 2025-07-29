import { z } from "zod";
import {
  pipelineStepSchema,
  jobSchema,
  jobRunInfoSchema,
  jobStatusSchema,
  jobMonitoringDataSchema,
  jobWithStepsSchema,
  jobDefinitionPipelineSchema,
  jobDefinitionSourceSchema,
  jobDefinitionSchema,
  createJobDefinitionSchema,
  updateJobDefinitionSchema
} from '../schemas/jobs';

// ============================================================================
// PIPELINE & JOB TYPES
// ============================================================================

export interface SourceJobData {
  jobId: string;
}

export interface PipelineJobData {
  jobDefinition: any;
  item: Record<string, unknown>;
  runId: string;
  jobId: string;
  itemIndex: number;
  sourceJobId: string;
}

export interface JobError {
  jobId: string;
  error: string;
  timestamp: Date;
  bullmqJobId?: string;
  attemptsMade: number;
  shouldRemoveFromQueue?: boolean;
}

export type JobDefinitionPipeline = z.infer<typeof jobDefinitionPipelineSchema>;
export type JobDefinitionSource = z.infer<typeof jobDefinitionSourceSchema>;
export type JobDefinition = z.infer<typeof jobDefinitionSchema>;
export type CreateJobDefinition = z.infer<typeof createJobDefinitionSchema>;
export type UpdateJobDefinition = z.infer<typeof updateJobDefinitionSchema>;
export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;

export type Job = z.infer<typeof jobSchema>;
