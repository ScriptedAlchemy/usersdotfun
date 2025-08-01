import { z } from "zod";
import {
  createWorkflowSchema,
  pluginRunSchema,
  sourceItemSchema,
  updateWorkflowSchema,
  workflowRunSchema,
  workflowSchema,
  richWorkflowSchema,
  baseWorkflowSchema
} from "../workflows";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  IdParamSchema,
  SimpleMessageDataSchema
} from "./common";

// GET /workflows
export const GetWorkflowsResponseSchema = ApiSuccessResponseSchema(z.array(workflowSchema));

// POST /workflows
export const CreateWorkflowRequestSchema = z.object({ body: createWorkflowSchema });
export const CreateWorkflowResponseSchema = ApiSuccessResponseSchema(baseWorkflowSchema);

// GET /workflows/:id
export const GetWorkflowRequestSchema = z.object({ params: IdParamSchema });
export const GetWorkflowResponseSchema = ApiSuccessResponseSchema(richWorkflowSchema);

// PUT /workflows/:id
export const UpdateWorkflowRequestSchema = z.object({
  params: IdParamSchema,
  body: updateWorkflowSchema,
});
export const UpdateWorkflowResponseSchema = ApiSuccessResponseSchema(baseWorkflowSchema);

// DELETE /workflows/:id
export const DeleteWorkflowRequestSchema = z.object({ params: IdParamSchema });
export const DeleteWorkflowResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// GET /workflows/:id/runs
export const GetWorkflowRunsRequestSchema = z.object({ params: IdParamSchema });
export const GetWorkflowRunsResponseSchema = ApiSuccessResponseSchema(z.array(workflowRunSchema));

// GET /workflows/:id/items
export const GetWorkflowItemsRequestSchema = z.object({ params: IdParamSchema });
export const GetWorkflowItemsResponseSchema = ApiSuccessResponseSchema(z.array(sourceItemSchema));

// GET /runs/:runId/details
export const GetRunDetailsRequestSchema = z.object({ params: z.object({ runId: z.string() }) });
export const GetRunDetailsResponseSchema = ApiSuccessResponseSchema(
  z.object({
    run: workflowRunSchema,
    pluginRuns: z.array(pluginRunSchema),
  })
);

// POST /runs/:runId/items/:itemId/retry
export const RetryFromStepRequestSchema = z.object({
  params: z.object({ runId: z.string(), itemId: z.string() }),
  body: z.object({ fromStepId: z.string() }),
});
export const RetryFromStepResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

export const WorkflowApiErrorResponseSchema = ApiErrorResponseSchema;
