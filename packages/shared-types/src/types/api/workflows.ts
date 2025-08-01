import { z } from "zod";
import {
  CreateWorkflowRequestSchema,
  CreateWorkflowResponseSchema,
  DeleteWorkflowRequestSchema,
  DeleteWorkflowResponseSchema,
  GetRunDetailsRequestSchema,
  GetRunDetailsResponseSchema,
  GetWorkflowItemsRequestSchema,
  GetWorkflowItemsResponseSchema,
  GetWorkflowRequestSchema,
  GetWorkflowResponseSchema,
  GetWorkflowRunsRequestSchema,
  GetWorkflowRunsResponseSchema,
  GetWorkflowsResponseSchema,
  RetryFromStepRequestSchema,
  RetryFromStepResponseSchema,
  UpdateWorkflowRequestSchema,
  UpdateWorkflowResponseSchema,
  WorkflowApiErrorResponseSchema,
} from '../../schemas/api/workflows';

// --- API REQUEST TYPES ---

export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type DeleteWorkflowRequest = z.infer<typeof DeleteWorkflowRequestSchema>;
export type GetWorkflowRequest = z.infer<typeof GetWorkflowRequestSchema>;
export type GetWorkflowRunsRequest = z.infer<typeof GetWorkflowRunsRequestSchema>;
export type GetWorkflowItemsRequest = z.infer<typeof GetWorkflowItemsRequestSchema>;
export type GetRunDetailsRequest = z.infer<typeof GetRunDetailsRequestSchema>;
export type RetryFromStepRequest = z.infer<typeof RetryFromStepRequestSchema>;

// --- API RESPONSE TYPES ---

export type GetWorkflowsResponse = z.infer<typeof GetWorkflowsResponseSchema>;
export type CreateWorkflowResponse = z.infer<typeof CreateWorkflowResponseSchema>;
export type GetWorkflowResponse = z.infer<typeof GetWorkflowResponseSchema>;
export type UpdateWorkflowResponse = z.infer<typeof UpdateWorkflowResponseSchema>;
export type DeleteWorkflowResponse = z.infer<typeof DeleteWorkflowResponseSchema>;
export type GetWorkflowRunsResponse = z.infer<typeof GetWorkflowRunsResponseSchema>;
export type GetWorkflowItemsResponse = z.infer<typeof GetWorkflowItemsResponseSchema>;
export type GetRunDetailsResponse = z.infer<typeof GetRunDetailsResponseSchema>;
export type RetryFromStepResponse = z.infer<typeof RetryFromStepResponseSchema>;
export type WorkflowApiErrorResponse = z.infer<typeof WorkflowApiErrorResponseSchema>;
