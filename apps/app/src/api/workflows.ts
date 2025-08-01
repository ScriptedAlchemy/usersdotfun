import { z } from "zod";
import { 
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
} from '@usersdotfun/shared-types/schemas';

import type {
  CreateWorkflow,
  Job,
  JobMonitoringData,
  WorkflowRunInfo,
  JobWithSteps,
  UpdateWorkflow,
  JobStatusSummary,
  JobRunDetails,
} from '@usersdotfun/shared-types/types';

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
  const res = await fetch(`${API_BASE_URL}/workflows`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobsListDataSchema));
  return extractData(apiResponse);
};

export const getJob = async (id: string): Promise<JobWithSteps> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobWithStepsDataSchema));
  return extractData(apiResponse);
};

export const createJob = async (job: CreateWorkflow): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobDataSchema));
  return extractData(apiResponse);
};

export const createWorkflow = async (workflow: CreateWorkflow): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobDataSchema));
  return extractData(apiResponse);
};

export const updateJob = async (id: string, job: UpdateWorkflow): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobDataSchema));
  return extractData(apiResponse);
};

export const deleteJob = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete job');
  }
};

export const getJobMonitoringData = async (id: string): Promise<JobMonitoringData> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/monitoring`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobMonitoringDataSchema));
  return extractData(apiResponse);
};

export const getJobStatus = async (id: string): Promise<JobStatusSummary> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/status`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobStatusSummaryDataSchema));
  return extractData(apiResponse);
};

export const getJobRuns = async (id: string): Promise<WorkflowRunInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/runs`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobRunsListDataSchema));
  return extractData(apiResponse);
};

export const getJobRunDetails = async (id: string, runId: string): Promise<JobRunDetails> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/runs/${runId}`);
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(JobRunDetailsDataSchema));
  return extractData(apiResponse);
};

export const retryJob = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/retry`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
};

export const retryPluginRun = async (workflowId: string, stepId: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/steps/${stepId}/retry`, {
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
  const res = await fetch(`${API_BASE_URL}/workflows/cleanup/orphaned`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, ApiSuccessResponseSchema(CleanupOrphanedJobsDataSchema));
  return extractData(apiResponse);
};
