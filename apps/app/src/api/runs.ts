import {
  GetWorkflowRunResponseSchema,
  ListWorkflowRunsResponseSchema,
  RetryFromStepResponseSchema,
} from '@usersdotfun/shared-types/schemas';
import { API_BASE_URL, extractData, handleResponse, authorizedFetch } from "./utils";

export const getWorkflowRuns = async (id: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/workflows/${id}/runs`);
  const apiResponse = await handleResponse(res, ListWorkflowRunsResponseSchema);
  return extractData(apiResponse);
};

export const getRunDetails = async (runId: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/workflows/runs/${runId}/details`);
  const apiResponse = await handleResponse(res, GetWorkflowRunResponseSchema);
  return extractData(apiResponse);
};

export const retryFromStep = async (runId: string, itemId: string, fromStepId: string) => {
  const res = await authorizedFetch(`${API_BASE_URL}/workflows/runs/${runId}/items/${itemId}/retry`, {
    method: 'POST',
    body: JSON.stringify({ fromStepId }),
  });
  const apiResponse = await handleResponse(res, RetryFromStepResponseSchema);
  return extractData(apiResponse);
};
