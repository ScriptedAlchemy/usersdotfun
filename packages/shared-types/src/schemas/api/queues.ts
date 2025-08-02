import { z } from 'zod';
import { queueStatusSchema, jobStatusSchema } from '../queues';
import { ApiSuccessResponseSchema, SimpleMessageDataSchema } from './common';

export const DeleteJobRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
    jobId: z.string(),
  }),
});

export const PauseQueueRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
  }),
});

export const ResumeQueueRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
  }),
});

export const ClearQueueRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
  }),
  body: z.object({
    jobType: z.enum(['all', 'completed', 'failed']),
  }),
});

export const GetAllQueueJobsRequestSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    queueName: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});

export const GetQueueJobsRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
  }),
  query: z.object({
    status: z.string(),
  }),
});

export const RemoveQueueJobRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
    jobId: z.string(),
  }),
});

export const RetryQueueJobRequestSchema = z.object({
  params: z.object({
    queueName: z.string(),
    jobId: z.string(),
  }),
});

export const GetQueuesStatusResponseSchema = ApiSuccessResponseSchema(z.array(queueStatusSchema));

export const GetAllQueueJobsResponseSchema = ApiSuccessResponseSchema(z.object({
  items: z.array(jobStatusSchema),
  total: z.number(),
}));

export const ClearQueueResponseSchema = ApiSuccessResponseSchema(z.object({
  removed: z.number(),
}));

export const GetQueueJobsResponseSchema = ApiSuccessResponseSchema(z.array(jobStatusSchema));

export const PauseQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

export const RemoveQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

export const ResumeQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

export const RetryQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);
