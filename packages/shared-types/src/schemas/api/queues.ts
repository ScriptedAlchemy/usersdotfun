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

// POST /queues/:queueName/pause
export const PauseQueueRequestSchema = z.object({
  params: z.object({ queueName: z.string() }),
});
export const PauseQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /queues/:queueName/resume
export const ResumeQueueRequestSchema = z.object({
  params: z.object({ queueName: z.string() }),
});
export const ResumeQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /queues/:queueName/clear
export const ClearQueueRequestSchema = z.object({
  params: z.object({ queueName: z.string() }),
  body: z.object({ jobType: z.enum(['all', 'completed', 'failed']).optional().default('all') }),
});
export const ClearQueueResponseSchema = ApiSuccessResponseSchema(z.object({ message: z.string(), removed: z.number() }));

// GET /queues/jobs (global jobs endpoint)
export const GetAllQueueJobsRequestSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    queueName: z.string().optional(),
    limit: z.coerce.number().optional().default(50),
    offset: z.coerce.number().optional().default(0),
  }),
});
export const GetAllQueueJobsResponseSchema = ApiSuccessResponseSchema(PaginatedDataSchema(jobStatusSchema));
