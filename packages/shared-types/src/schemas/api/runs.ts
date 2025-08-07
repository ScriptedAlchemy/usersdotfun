import { z } from "zod";
import { richWorkflowRunSchema, richWorkflowRunSummarySchema } from "../runs";
import { ApiSuccessResponseSchema, IdParamSchema, SimpleMessageDataSchema } from "./common";

// GET /workflows/:id/runs
export const ListWorkflowRunsRequestSchema = z.object({ params: IdParamSchema });
export const ListWorkflowRunsResponseSchema = ApiSuccessResponseSchema(z.array(richWorkflowRunSummarySchema));

// POST /runs/:runId/items/:itemId/retry
export const RetryFromStepRequestSchema = z.object({
  params: z.object({ runId: z.string(), itemId: z.string() }),
  body: z.object({ fromStepId: z.string() }),
});
export const RetryFromStepResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// GET /runs/:runId
export const GetWorkflowRunRequestSchema = z.object({ params: z.object({ runId: z.string() }) });
export const GetWorkflowRunResponseSchema = ApiSuccessResponseSchema(richWorkflowRunSchema);
