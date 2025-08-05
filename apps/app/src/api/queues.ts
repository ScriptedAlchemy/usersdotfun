import {
  ClearQueueResponseSchema,
  GetAllQueueJobsResponseSchema,
  GetQueueJobsResponseSchema,
  GetQueuesStatusResponseSchema,
  PauseQueueResponseSchema,
  RemoveQueueJobResponseSchema,
  ResumeQueueResponseSchema,
  RetryQueueJobResponseSchema,
} from '@usersdotfun/shared-types/schemas';

import { API_BASE_URL, extractData, handleResponse, authorizedFetch } from "./utils";

export const getQueuesStatus = async () => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues`);
  const apiResponse = await handleResponse(res, GetQueuesStatusResponseSchema);
  return extractData(apiResponse);
};

export const getQueueDetails = async (queueName: string) => {
  // This function gets jobs for a specific queue with all statuses
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/jobs?status=all`);
  const apiResponse = await handleResponse(res, GetQueueJobsResponseSchema);
  return extractData(apiResponse);
};

export const getQueueJobs = async (queueName: string, status: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/jobs?status=${status}`);
  const apiResponse = await handleResponse(res, GetQueueJobsResponseSchema);
  return extractData(apiResponse);
};

export const getAllQueueJobs = async (filters?: {
  status?: string;
  queueName?: string;
  limit?: number;
  offset?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.queueName) params.append('queueName', filters.queueName);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const res = await authorizedFetch(`${API_BASE_URL}/queues/jobs?${params}`);
  const apiResponse = await handleResponse(res, GetAllQueueJobsResponseSchema);
  return extractData(apiResponse);
};

export const retryQueueJob = async (queueName: string, jobId: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/jobs/${jobId}/retry`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, RetryQueueJobResponseSchema);
  return extractData(apiResponse);
};

export const removeQueueJob = async (queueName: string, jobId: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/jobs/${jobId}`, {
    method: 'DELETE',
  });
  const apiResponse = await handleResponse(res, RemoveQueueJobResponseSchema);
  return extractData(apiResponse);
};

export const pauseQueue = async (queueName: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/pause`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, PauseQueueResponseSchema);
  return extractData(apiResponse);
};

export const resumeQueue = async (queueName: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/resume`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, ResumeQueueResponseSchema);
  return extractData(apiResponse);
};

export const clearQueue = async (queueName: string, jobType: 'all' | 'completed' | 'failed' = 'all') => {
  const res = await authorizedFetch(`${API_BASE_URL}/queues/${queueName}/clear`, {
    method: 'POST',
    body: JSON.stringify({ jobType }),
  });
  const apiResponse = await handleResponse(res, ClearQueueResponseSchema);
  return extractData(apiResponse);
};
