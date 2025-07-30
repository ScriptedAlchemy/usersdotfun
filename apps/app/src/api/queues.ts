import { z } from 'zod';
import {
  ApiSuccessResponseSchema,
  QueuesOverviewDataSchema,
  QueueDetailsDataSchema,
  QueueActionResultDataSchema,
  QueueClearResultDataSchema,
  AllQueueJobsDataSchema,
  SimpleMessageDataSchema,
} from '@usersdotfun/shared-types/schemas';

import type {
  QueueOverview,
  QueueDetails,
  QueueActionResult,
  QueueItem,
} from '@usersdotfun/shared-types/types';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
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

export async function getQueuesOverview(): Promise<{ queues: Record<string, QueueOverview>; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/status`);
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(QueuesOverviewDataSchema));
  return extractData(apiResponse);
}

export async function getQueueDetails(queueName: string): Promise<QueueDetails> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}`);
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(QueueDetailsDataSchema));
  return extractData(apiResponse);
}

export async function pauseQueue(queueName: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/pause`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
}

export async function resumeQueue(queueName: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/resume`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
}

export async function clearQueue(queueName: string): Promise<{ message: string; itemsRemoved: number }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/clear`, {
    method: 'DELETE',
  });
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(QueueClearResultDataSchema));
  return extractData(apiResponse);
}

export async function purgeFailedJobs(queueName: string): Promise<{ message: string; itemsRemoved: number }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/purge`, {
    method: 'DELETE',
  });
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(QueueClearResultDataSchema));
  return extractData(apiResponse);
}

export async function retryQueueItem(queueName: string, itemId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/jobs/${itemId}/retry`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
}

export async function removeQueueItem(queueName: string, itemId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/jobs/${itemId}`, {
    method: 'DELETE',
  });
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(SimpleMessageDataSchema));
  return extractData(apiResponse);
}

export async function getAllQueueJobs(filters?: {
  status?: string;
  queueName?: string;
  limit?: number;
}): Promise<{
  jobs: Array<QueueItem & { queueName: string; status: string }>;
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.queueName) params.append('queueName', filters.queueName);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE_URL}/queues/jobs?${params}`);
  const apiResponse = await handleResponse(response, ApiSuccessResponseSchema(AllQueueJobsDataSchema));
  return extractData(apiResponse);
}

// Backward compatibility function
export async function getAllQueueJobsByStatus(status?: string, limit?: number): Promise<{
  jobs: Array<QueueItem & { queueName: string; status: string }>;
  total: number;
}> {
  return getAllQueueJobs({ status, limit });
}
