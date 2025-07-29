import { z } from "zod";
import {
  pipelineStepSchema,
  jobSchema,
  jobRunInfoSchema,
  jobStatusSchema,
  jobMonitoringDataSchema,
  jobWithStepsSchema,
} from '../schemas/jobs';

// ============================================================================
// PIPELINE & JOB TYPES
// ============================================================================

export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;
export type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
