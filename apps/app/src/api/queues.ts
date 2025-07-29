import { z } from 'zod';
import { QueueOverview, QueueDetails, QueueActionResult, QueueItem, queueOverviewSchema, queueDetailsSchema, queueActionResultSchema } from '@usersdotfun/shared-types';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  const data = await response.json();
  return schema.parse(data);
}

export async function getQueuesOverview(): Promise<{ queues: Record<string, QueueOverview>; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/status`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch queues overview');
  }
  return response.json();
}

export async function getQueueDetails(queueName: string): Promise<QueueDetails> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}`);
  return handleResponse(response, queueDetailsSchema);
}

export async function pauseQueue(queueName: string): Promise<QueueActionResult> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/pause`, {
    method: 'POST',
  });
  return handleResponse(response, queueActionResultSchema);
}

export async function resumeQueue(queueName: string): Promise<QueueActionResult> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/resume`, {
    method: 'POST',
  });
  return handleResponse(response, queueActionResultSchema);
}

export async function clearQueue(queueName: string): Promise<QueueActionResult> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/clear`, {
    method: 'DELETE',
  });
  return handleResponse(response, queueActionResultSchema);
}

export async function purgeFailedJobs(queueName: string): Promise<QueueActionResult> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/purge`, {
    method: 'DELETE',
  });
  return handleResponse(response, queueActionResultSchema);
}

export async function retryQueueItem(queueName: string, itemId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/jobs/${itemId}/retry`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to retry queue item');
  }
  return response.json();
}

export async function removeQueueItem(queueName: string, itemId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/queues/${queueName}/jobs/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove queue item');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch all queue jobs');
  }
  return response.json();
}

// Backward compatibility function
export async function getAllQueueJobsByStatus(status?: string, limit?: number): Promise<{
  jobs: Array<QueueItem & { queueName: string; status: string }>;
  total: number;
}> {
  return getAllQueueJobs({ status, limit });
}
