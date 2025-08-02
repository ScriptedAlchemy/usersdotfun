import {
  CreateWorkflowResponseSchema,
  GetWorkflowItemsResponseSchema,
  GetWorkflowResponseSchema,
  GetWorkflowsResponseSchema,
  UpdateWorkflowResponseSchema
} from '@usersdotfun/shared-types/schemas';

import type {
  CreateWorkflowRequest,
  UpdateWorkflowRequest
} from '@usersdotfun/shared-types/types';
import { API_BASE_URL, extractData, handleResponse } from "./utils";

export const getWorkflows = async () => {
  const res = await fetch(`${API_BASE_URL}/workflows`);
  const apiResponse = await handleResponse(res, GetWorkflowsResponseSchema);
  console.log("apiResponse", apiResponse);
  return extractData(apiResponse);
};

export const createWorkflow = async (workflow: CreateWorkflowRequest['body']) => {
  const res = await fetch(`${API_BASE_URL}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  const apiResponse = await handleResponse(res, CreateWorkflowResponseSchema);
  return extractData(apiResponse);
};

export const getWorkflow = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`);
  const apiResponse = await handleResponse(res, GetWorkflowResponseSchema);
  return extractData(apiResponse);
};

export const updateWorkflow = async (id: string, workflow: UpdateWorkflowRequest['body']) => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  const apiResponse = await handleResponse(res, UpdateWorkflowResponseSchema);
  return extractData(apiResponse);
};

export const deleteWorkflow = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || error.message || 'Failed to delete workflow');
  }
};

export const toggleWorkflowStatus = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/toggle`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, UpdateWorkflowResponseSchema);
  return extractData(apiResponse);
};

export const runWorkflowNow = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/run`, {
    method: 'POST',
  });
  const apiResponse = await handleResponse(res, UpdateWorkflowResponseSchema);
  return extractData(apiResponse);
};

export const getWorkflowItems = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/items`);
  const apiResponse = await handleResponse(res, GetWorkflowItemsResponseSchema);
  return extractData(apiResponse);
};

export const retryWorkflow = async (workflowId: string) => {
  // TODO: needs to be implemented
  throw new Error('retryWorkflow endpoint not implemented in gateway yet');
};
