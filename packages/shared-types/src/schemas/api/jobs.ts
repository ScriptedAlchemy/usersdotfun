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
    cleanupTime: z.iso.datetime(),
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
