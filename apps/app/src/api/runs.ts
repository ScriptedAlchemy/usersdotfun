import {
  GetRunDetailsResponseSchema,
  GetWorkflowRunsResponseSchema,
  RetryFromStepResponseSchema,
} from '@usersdotfun/shared-types/schemas';
import { API_BASE_URL, extractData, handleResponse } from "./utils";

export const getWorkflowRuns = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}/runs`);
  const apiResponse = await handleResponse(res, GetWorkflowRunsResponseSchema);
  return extractData(apiResponse);
};

export const getRunDetails = async (runId: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/runs/${runId}/details`);
  const apiResponse = await handleResponse(res, GetRunDetailsResponseSchema);
  return extractData(apiResponse);
};

export const retryFromStep = async (runId: string, itemId: string, fromStepId: string) => {
  const res = await fetch(`${API_BASE_URL}/workflows/runs/${runId}/items/${itemId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromStepId }),
  });
  const apiResponse = await handleResponse(res, RetryFromStepResponseSchema);
  return extractData(apiResponse);
};
