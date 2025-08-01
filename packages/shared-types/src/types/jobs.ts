import { z } from "zod";
import {
  pipelineStepSchema,
  jobSchema,
  jobRunInfoSchema,
  jobStatusSchema,
  jobMonitoringDataSchema,
  jobWithStepsSchema,
  workflowPipelineSchema,
  workflowSourceSchema,
  workflowSchema,
  createWorkflowSchema,
  updateWorkflowSchema,
  jobStatusSummarySchema,
  jobRunDetailsSchema,
} from '../schemas/workflows';

// ============================================================================
// PIPELINE & JOB TYPES
// ============================================================================

export interface SourceJobData {
  jobId: string;
}

export interface PipelineJobData {
  workflow: any;
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

export type WorkflowPipeline = z.infer<typeof workflowPipelineSchema>;
export type WorkflowSource = z.infer<typeof workflowSourceSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;
export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobStatusSummary = z.infer<typeof jobStatusSummarySchema>;
export type JobRunDetails = z.infer<typeof jobRunDetailsSchema>;
export type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;

export type Job = z.infer<typeof jobSchema>;
