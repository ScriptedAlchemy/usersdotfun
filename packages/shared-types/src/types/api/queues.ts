import { z } from "zod";
import {
  GetQueueJobsRequestSchema,
  GetQueueJobsResponseSchema,
  GetQueuesStatusResponseSchema,
  RetryQueueJobRequestSchema,
  RetryQueueJobResponseSchema,
} from '../../schemas/api/queues';

// --- API REQUEST TYPES ---

export type GetQueueJobsRequest = z.infer<typeof GetQueueJobsRequestSchema>;
export type RetryQueueJobRequest = z.infer<typeof RetryQueueJobRequestSchema>;

// --- API RESPONSE TYPES ---

export type GetQueuesStatusResponse = z.infer<typeof GetQueuesStatusResponseSchema>;
export type GetQueueJobsResponse = z.infer<typeof GetQueueJobsResponseSchema>;
export type RetryQueueJobResponse = z.infer<typeof RetryQueueJobResponseSchema>;