import { z } from "zod";
import {
  createJobDefinitionSchema,
  jobDefinitionSchema,
  jobMonitoringDataSchema,
  jobRunDetailsSchema,
  jobRunInfoSchema,
  jobSchema,
  jobStatusSummarySchema,
  jobWithStepsSchema,
  updateJobDefinitionSchema
} from "../jobs";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  IdParamSchema,
  LimitQuerySchema,
  SimpleMessageDataSchema,
  StatusQuerySchema
} from "./common";

// ============================================================================
// JOB API REQUEST SCHEMAS
// ============================================================================

// URL Parameters
export const JobIdParamSchema = IdParamSchema;
export const JobStepParamsSchema = z.object({
  id: z.string().min(1),
  stepId: z.string().min(1),
});
export const JobRunParamsSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
});

// Query Parameters
export const JobsListQuerySchema = StatusQuerySchema.merge(LimitQuerySchema);

// Request Bodies
export const CreateJobRequestBodySchema = createJobDefinitionSchema;
export const CreateJobDefinitionRequestBodySchema = createJobDefinitionSchema;
export const UpdateJobRequestBodySchema = updateJobDefinitionSchema;

// ============================================================================
// JOB API RESPONSE SCHEMAS
// ============================================================================

// Success Response Data Schemas
export const JobDataSchema = jobSchema;
export const JobDefinitionDataSchema = jobDefinitionSchema;
export const JobWithStepsDataSchema = jobWithStepsSchema;
export const JobRunInfoDataSchema = jobRunInfoSchema;
export const JobStatusSummaryDataSchema = jobStatusSummarySchema;
export const JobRunDetailsDataSchema = jobRunDetailsSchema;
export const JobMonitoringDataSchema = jobMonitoringDataSchema;
export const JobsListDataSchema = z.array(JobDataSchema);
export const JobRunsListDataSchema = z.array(JobRunInfoDataSchema);

// Cleanup Response Data
export const CleanupOrphanedJobsDataSchema = z.object({
  message: z.string(),
  cleaned: z.number(),
  details: z.object({
    orphanedJobs: z.array(z.string()),
    cleanupTime: z.string().datetime(),
  }).optional(),
});

// ============================================================================
// COMPLETE API CONTRACT SCHEMAS
// ============================================================================

// GET /jobs
export const GetJobsRequestSchema = z.object({
  query: JobsListQuerySchema,
});
export const GetJobsResponseSchema = ApiSuccessResponseSchema(JobsListDataSchema);

// GET /jobs/:id
export const GetJobRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobResponseSchema = ApiSuccessResponseSchema(JobWithStepsDataSchema);

// POST /jobs
export const CreateJobRequestSchema = z.object({
  body: CreateJobRequestBodySchema,
});
export const CreateJobResponseSchema = ApiSuccessResponseSchema(JobDataSchema);

// POST /jobs/definition
export const CreateJobDefinitionRequestSchema = z.object({
  body: CreateJobDefinitionRequestBodySchema,
});
export const CreateJobDefinitionResponseSchema = ApiSuccessResponseSchema(JobDataSchema);

// PUT /jobs/:id
export const UpdateJobRequestSchema = z.object({
  params: JobIdParamSchema,
  body: UpdateJobRequestBodySchema,
});
export const UpdateJobResponseSchema = ApiSuccessResponseSchema(JobDataSchema);

// DELETE /jobs/:id
export const DeleteJobRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const DeleteJobResponseSchema = z.object({
  statusCode: z.literal(204),
  success: z.literal(true),
});

// GET /jobs/:id/status
export const GetJobStatusRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobStatusResponseSchema = ApiSuccessResponseSchema(JobStatusSummaryDataSchema);

// GET /jobs/:id/monitoring
export const GetJobMonitoringRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobMonitoringResponseSchema = ApiSuccessResponseSchema(JobMonitoringDataSchema);

// GET /jobs/:id/runs
export const GetJobRunsRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobRunsResponseSchema = ApiSuccessResponseSchema(JobRunsListDataSchema);

// GET /jobs/:id/runs/:runId
export const GetJobRunDetailsRequestSchema = z.object({
  params: JobRunParamsSchema,
});
export const GetJobRunDetailsResponseSchema = ApiSuccessResponseSchema(JobRunDetailsDataSchema);

// POST /jobs/:id/retry
export const RetryJobRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const RetryJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /jobs/:id/steps/:stepId/retry
export const RetryJobStepRequestSchema = z.object({
  params: JobStepParamsSchema,
});
export const RetryJobStepResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /jobs/cleanup/orphaned
export const CleanupOrphanedJobsRequestSchema = z.object({});
export const CleanupOrphanedJobsResponseSchema = ApiSuccessResponseSchema(CleanupOrphanedJobsDataSchema);

// ============================================================================
// ERROR RESPONSE SCHEMAS
// ============================================================================

export const JobsApiErrorResponseSchema = ApiErrorResponseSchema;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type JobStepParams = z.infer<typeof JobStepParamsSchema>;
export type JobRunParams = z.infer<typeof JobRunParamsSchema>;
export type JobsListQuery = z.infer<typeof JobsListQuerySchema>;

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type CreateJobDefinitionRequest = z.infer<typeof CreateJobDefinitionRequestSchema>;
export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;

export type JobData = z.infer<typeof JobDataSchema>;
export type JobDefinitionData = z.infer<typeof JobDefinitionDataSchema>;
export type JobWithStepsData = z.infer<typeof JobWithStepsDataSchema>;
export type JobRunInfoData = z.infer<typeof JobRunInfoDataSchema>;
export type JobStatusSummaryData = z.infer<typeof JobStatusSummaryDataSchema>;
export type JobRunDetailsData = z.infer<typeof JobRunDetailsDataSchema>;
export type JobMonitoringData = z.infer<typeof JobMonitoringDataSchema>;
export type JobsListData = z.infer<typeof JobsListDataSchema>;
export type JobRunsListData = z.infer<typeof JobRunsListDataSchema>;
export type CleanupOrphanedJobsData = z.infer<typeof CleanupOrphanedJobsDataSchema>;

// Response Types
export type GetJobsResponse = z.infer<typeof GetJobsResponseSchema>;
export type GetJobResponse = z.infer<typeof GetJobResponseSchema>;
export type CreateJobResponse = z.infer<typeof CreateJobResponseSchema>;
export type CreateJobDefinitionResponse = z.infer<typeof CreateJobDefinitionResponseSchema>;
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
