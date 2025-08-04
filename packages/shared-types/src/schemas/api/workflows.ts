import { z } from "zod";
import {
  createWorkflowSchema,
  richWorkflowSchema,
  richWorkflowSummarySchema,
  updateWorkflowSchema,
  workflowSchema
} from "../workflows";

import {
  sourceItemSchema,
  workflowRunSchema
} from "../runs";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  IdParamSchema,
  SimpleMessageDataSchema
} from "./common";

// GET /workflows
export const GetWorkflowsResponseSchema = ApiSuccessResponseSchema(z.array(richWorkflowSummarySchema));

// POST /workflows
export const CreateWorkflowRequestSchema = z.object({ body: createWorkflowSchema });
export const CreateWorkflowResponseSchema = ApiSuccessResponseSchema(workflowSchema);

// GET /workflows/:id
export const GetWorkflowRequestSchema = z.object({ params: IdParamSchema });
export const GetWorkflowResponseSchema = ApiSuccessResponseSchema(richWorkflowSchema);

// PUT /workflows/:id
export const UpdateWorkflowRequestSchema = z.object({
  params: IdParamSchema,
  body: updateWorkflowSchema,
});
export const UpdateWorkflowResponseSchema = ApiSuccessResponseSchema(workflowSchema);

// DELETE /workflows/:id
export const DeleteWorkflowRequestSchema = z.object({ params: IdParamSchema });
export const DeleteWorkflowResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /workflows/:id/toggle
export const ToggleWorkflowRequestSchema = z.object({ params: IdParamSchema });
export const ToggleWorkflowResponseSchema = ApiSuccessResponseSchema(workflowSchema);

// POST /workflows/:id/run
export const RunWorkflowRequestSchema = z.object({ params: IdParamSchema });
export const RunWorkflowResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// GET /workflows/:id/runs
export const GetWorkflowRunsRequestSchema = z.object({ params: IdParamSchema });
export const GetWorkflowRunsResponseSchema = ApiSuccessResponseSchema(z.array(workflowRunSchema));

// GET /workflows/:id/items
export const GetWorkflowItemsRequestSchema = z.object({ params: IdParamSchema });
export const GetWorkflowItemsResponseSchema = ApiSuccessResponseSchema(z.array(sourceItemSchema));

export const WorkflowApiErrorResponseSchema = ApiErrorResponseSchema;
