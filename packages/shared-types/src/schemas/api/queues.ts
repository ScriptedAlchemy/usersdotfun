import { z } from "zod";
import { jobStatusSchema, queueStatusSchema } from "../queues";
import {
  ApiSuccessResponseSchema,
  PaginatedDataSchema,
  SimpleMessageDataSchema
} from "./common";

// GET /queues/status
export const GetQueuesStatusResponseSchema = ApiSuccessResponseSchema(z.array(queueStatusSchema));

// GET /queues/:queueName/jobs
export const GetQueueJobsRequestSchema = z.object({
  params: z.object({ queueName: z.string() }),
  query: z.object({ status: z.string() }),
});
export const GetQueueJobsResponseSchema = ApiSuccessResponseSchema(PaginatedDataSchema(jobStatusSchema));

// POST /queues/:queueName/jobs/:jobId/retry
export const RetryQueueJobRequestSchema = z.object({
  params: z.object({ queueName: z.string(), jobId: z.string() }),
});
export const RetryQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// DELETE /queues/:queueName/jobs/:jobId
export const RemoveQueueJobRequestSchema = z.object({
  params: z.object({ queueName: z.string(), jobId: z.string() }),
});
export const RemoveQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);