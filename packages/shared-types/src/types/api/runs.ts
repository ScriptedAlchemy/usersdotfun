import { z } from "zod";
import {
  ListWorkflowRunsRequestSchema,
  ListWorkflowRunsResponseSchema,
  RetryFromStepRequestSchema,
  RetryFromStepResponseSchema,
} from '../../schemas/api/runs';

// --- API REQUEST TYPES ---

export type ListWorkflowRunsRequest = z.infer<typeof ListWorkflowRunsRequestSchema>;
export type RetryFromStepRequest = z.infer<typeof RetryFromStepRequestSchema>;

// --- API RESPONSE TYPES ---

export type ListWorkflowRunsResponse = z.infer<typeof ListWorkflowRunsResponseSchema>;
export type RetryFromStepResponse = z.infer<typeof RetryFromStepResponseSchema>;
