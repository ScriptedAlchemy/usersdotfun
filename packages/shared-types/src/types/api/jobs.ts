import { z } from "zod";
import {
  CleanupOrphanedJobsResponseSchema,
  CreateWorkflowRequestSchema,
  CreateWorkflowResponseSchema,
  CreateJobRequestSchema,
  CreateJobResponseSchema,
  DeleteJobResponseSchema,
  GetJobMonitoringResponseSchema,
  GetJobResponseSchema,
  GetJobRunDetailsResponseSchema,
  GetJobRunsResponseSchema,
  GetJobsResponseSchema,
  GetJobStatusResponseSchema,
  JobIdParamSchema,
  JobRunParamsSchema,
  JobsApiErrorResponseSchema,
  JobsListQuerySchema,
  JobStepParamsSchema,
  RetryJobResponseSchema,
  RetryJobStepResponseSchema,
  UpdateJobRequestSchema,
  UpdateJobResponseSchema
} from '../../schemas/api/workflows';

// ============================================================================
// API PARAMETER TYPES
// ============================================================================

export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type JobStepParams = z.infer<typeof JobStepParamsSchema>;
export type JobRunParams = z.infer<typeof JobRunParamsSchema>;
export type JobsListQuery = z.infer<typeof JobsListQuerySchema>;

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type GetJobsResponse = z.infer<typeof GetJobsResponseSchema>;
export type GetJobResponse = z.infer<typeof GetJobResponseSchema>;
export type CreateJobResponse = z.infer<typeof CreateJobResponseSchema>;
export type CreateWorkflowResponse = z.infer<typeof CreateWorkflowResponseSchema>;
export type UpdateJobResponse = z.infer<typeof UpdateJobResponseSchema>;
export type DeleteJobResponse = z.infer<typeof DeleteJobResponseSchema>;
export type GetJobStatusResponse = z.infer<typeof GetJobStatusResponseSchema>;
export type GetJobMonitoringResponse = z.infer<typeof GetJobMonitoringResponseSchema>;
export type GetJobRunsResponse = z.infer<typeof GetJobRunsResponseSchema>;
export type GetJobRunDetailsResponse = z.infer<typeof GetJobRunDetailsResponseSchema>;
export type RetryJobResponse = z.infer<typeof RetryJobResponseSchema>;
export type RetryJobStepResponse = z.infer<typeof RetryJobStepResponseSchema>;
export type CleanupOrphanedJobsResponse = z.infer<typeof CleanupOrphanedJobsResponseSchema>;
export type JobsApiErrorResponse = z.infer<typeof JobsApiErrorResponseSchema>;
