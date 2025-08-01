import { z } from "zod";
import {
  ClearQueueRequestSchema,
  ClearQueueResponseSchema,
  GetAllQueueJobsRequestSchema,
  GetAllQueueJobsResponseSchema,
  GetQueueJobsRequestSchema,
  GetQueueJobsResponseSchema,
  GetQueuesStatusResponseSchema,
  PauseQueueRequestSchema,
  PauseQueueResponseSchema,
  RemoveQueueJobRequestSchema,
  RemoveQueueJobResponseSchema,
  ResumeQueueRequestSchema,
  ResumeQueueResponseSchema,
  RetryQueueJobRequestSchema,
  RetryQueueJobResponseSchema,
} from '../../schemas/api/queues';

// --- API REQUEST TYPES ---

export type GetQueueJobsRequest = z.infer<typeof GetQueueJobsRequestSchema>;
export type GetAllQueueJobsRequest = z.infer<typeof GetAllQueueJobsRequestSchema>;
export type RetryQueueJobRequest = z.infer<typeof RetryQueueJobRequestSchema>;
export type RemoveQueueJobRequest = z.infer<typeof RemoveQueueJobRequestSchema>;
export type PauseQueueRequest = z.infer<typeof PauseQueueRequestSchema>;
export type ResumeQueueRequest = z.infer<typeof ResumeQueueRequestSchema>;
export type ClearQueueRequest = z.infer<typeof ClearQueueRequestSchema>;

// --- API RESPONSE TYPES ---

export type GetQueuesStatusResponse = z.infer<typeof GetQueuesStatusResponseSchema>;
export type GetQueueJobsResponse = z.infer<typeof GetQueueJobsResponseSchema>;
export type GetAllQueueJobsResponse = z.infer<typeof GetAllQueueJobsResponseSchema>;
export type RetryQueueJobResponse = z.infer<typeof RetryQueueJobResponseSchema>;
export type RemoveQueueJobResponse = z.infer<typeof RemoveQueueJobResponseSchema>;
export type PauseQueueResponse = z.infer<typeof PauseQueueResponseSchema>;
export type ResumeQueueResponse = z.infer<typeof ResumeQueueResponseSchema>;
export type ClearQueueResponse = z.infer<typeof ClearQueueResponseSchema>;
