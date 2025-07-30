import { z } from "zod";
import { 
  createJobDefinitionSchema, 
  jobSchema,
  jobMonitoringDataSchema, 
  jobRunInfoSchema, 
  jobWithStepsSchema, 
  updateJobDefinitionSchema,
  jobStatusSummarySchema,
  jobRunDetailsSchema,
  ApiSuccessResponseSchema,
  JobsListDataSchema,
  JobWithStepsDataSchema,
  JobDataSchema,
  JobStatusSummaryDataSchema,
  JobMonitoringDataSchema,
  JobRunsListDataSchema,
  JobRunDetailsDataSchema,
  SimpleMessageDataSchema,
  CleanupOrphanedJobsDataSchema,
} from '@usersdotfun/shared-types';

// Type aliases for easier use
type CreateJobDefinition = z.infer<typeof createJobDefinitionSchema>;
type Job = z.infer<typeof jobSchema>;
type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
type JobWithSteps = z.infer<typeof jobWithStepsSchema>;
type UpdateJobDefinition = z.infer<typeof updateJobDefinitionSchema>;
type JobStatusSummary = z.infer<typeof jobStatusSummarySchema>;
type JobRunDetails = z.infer<typeof jobRunDetailsSchema>;

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.error || 'API request failed';
    
    // Create a more specific error object with status information
    const apiError = new Error(errorMessage) as Error & { status: number; isNotFound: boolean };
    apiError.status = response.status;
    apiError.isNotFound = response.status === 404;
    
    throw apiError;
  }
  const data = await response.json();
  return schema.parse(data);
}

// Helper function to extract data from API success response
function extractData<T>(apiResponse: { data?: T }): T {
  if (!apiResponse.data) {
    throw new Error('API response missing data field');
  }
  return apiResponse.data;
}

export const getJobs = async (): Promise<Job[]> => {
  const res = await fetch(`${API_BASE_URL}/jobs`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobsListDataSchema));
  return extractData(apiResponse);
};

export const getJob = async (id: string): Promise<JobWithSteps> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobWithStepsDataSchema));
  return extractData(apiResponse);
};

export const createJob = async (job: CreateJobDefinition): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobDataSchema));
  return extractData(apiResponse);
};

export const createJobDefinition = async (jobDefinition: CreateJobDefinition): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/jobs/definition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobDefinition),
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobDataSchema));
  return extractData(apiResponse);
};

export const updateJob = async (id: string, job: UpdateJobDefinition): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobDataSchema));
  return extractData(apiResponse);
};

export const deleteJob = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete job');
  }
};

export const getJobMonitoringData = async (id: string): Promise<JobMonitoringData> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/monitoring`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobMonitoringDataSchema));
  return extractData(apiResponse);
};

export const getJobStatus = async (id: string): Promise<JobStatusSummary> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/status`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobStatusSummaryDataSchema));
  return extractData(apiResponse);
};

export const getJobRuns = async (id: string): Promise<JobRunInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/runs`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobRunsListDataSchema));
  return extractData(apiResponse);
};

export const getJobRunDetails = async (id: string, runId: string): Promise<JobRunDetails> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/runs/${runId}`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobRunDetailsDataSchema));
  return extractData(apiResponse);
};

export const retryJob = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/retry`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
};

export const retryPipelineStep = async (jobId: string, stepId: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/steps/${stepId}/retry`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
};

export const cleanupOrphanedJobs = async (): Promise<{
  message: string;
  cleaned: number;
  details?: {
    orphanedJobs: string[];
    cleanupTime: string;
  };
}> => {
  const res = await fetch(`${API_BASE_URL}/jobs/cleanup/orphaned`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(CleanupOrphanedJobsDataSchema));
  return extractData(apiResponse);
};
