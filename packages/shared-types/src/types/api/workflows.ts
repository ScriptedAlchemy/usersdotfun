import { z } from "zod";
import {
  CreateWorkflowRequestSchema,
  CreateWorkflowResponseSchema,
  DeleteWorkflowRequestSchema,
  DeleteWorkflowResponseSchema,
  GetWorkflowItemsRequestSchema,
  GetWorkflowItemsResponseSchema,
  GetWorkflowRequestSchema,
  GetWorkflowResponseSchema,
  GetWorkflowRunsRequestSchema,
  GetWorkflowRunsResponseSchema,
  GetWorkflowsResponseSchema,
  RunWorkflowRequestSchema,
  RunWorkflowResponseSchema,
  ToggleWorkflowRequestSchema,
  ToggleWorkflowResponseSchema,
  UpdateWorkflowRequestSchema,
  UpdateWorkflowResponseSchema,
  WorkflowApiErrorResponseSchema,
} from '../../schemas/api/workflows';

// --- API REQUEST TYPES ---

export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type DeleteWorkflowRequest = z.infer<typeof DeleteWorkflowRequestSchema>;
export type ToggleWorkflowRequest = z.infer<typeof ToggleWorkflowRequestSchema>;
export type RunWorkflowRequest = z.infer<typeof RunWorkflowRequestSchema>;
export type GetWorkflowRequest = z.infer<typeof GetWorkflowRequestSchema>;
export type GetWorkflowRunsRequest = z.infer<typeof GetWorkflowRunsRequestSchema>;
export type GetWorkflowItemsRequest = z.infer<typeof GetWorkflowItemsRequestSchema>;

// --- API RESPONSE TYPES ---

export type GetWorkflowsResponse = z.infer<typeof GetWorkflowsResponseSchema>;
export type CreateWorkflowResponse = z.infer<typeof CreateWorkflowResponseSchema>;
export type GetWorkflowResponse = z.infer<typeof GetWorkflowResponseSchema>;
export type UpdateWorkflowResponse = z.infer<typeof UpdateWorkflowResponseSchema>;
export type DeleteWorkflowResponse = z.infer<typeof DeleteWorkflowResponseSchema>;
export type ToggleWorkflowResponse = z.infer<typeof ToggleWorkflowResponseSchema>;
export type RunWorkflowResponse = z.infer<typeof RunWorkflowResponseSchema>;
export type GetWorkflowRunsResponse = z.infer<typeof GetWorkflowRunsResponseSchema>;
export type GetWorkflowItemsResponse = z.infer<typeof GetWorkflowItemsResponseSchema>;
export type WorkflowApiErrorResponse = z.infer<typeof WorkflowApiErrorResponseSchema>;
