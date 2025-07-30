import { z } from "zod";
import {
  QueueNameParamSchema,
  QueueJobParamsSchema,
  QueuesStatusQuerySchema,
  QueueJobsQuerySchema,
  QueueItemsQuerySchema,
  ClearQueueQuerySchema,
  QueueStatusDataSchema,
  QueueOverviewDataSchema,
  QueueDetailsDataSchema,
  QueueItemDataSchema,
  QueueActionResultDataSchema,
  QueuesOverviewDataSchema,
  AllQueueJobsDataSchema,
  QueueItemsDataSchema,
  QueueClearResultDataSchema,
  GetQueuesStatusResponseSchema,
  GetAllQueueJobsResponseSchema,
  GetQueueDetailsResponseSchema,
  GetQueueItemsResponseSchema,
  PauseQueueResponseSchema,
  ResumeQueueResponseSchema,
  ClearQueueResponseSchema,
  PurgeQueueResponseSchema,
  RemoveQueueJobResponseSchema,
  RetryQueueJobResponseSchema,
  QueuesApiErrorResponseSchema,
} from '../../schemas/api/queues';

// ============================================================================
// API PARAMETER TYPES
// ============================================================================

export type QueueNameParam = z.infer<typeof QueueNameParamSchema>;
export type QueueJobParams = z.infer<typeof QueueJobParamsSchema>;
export type QueuesStatusQuery = z.infer<typeof QueuesStatusQuerySchema>;
export type QueueJobsQuery = z.infer<typeof QueueJobsQuerySchema>;
export type QueueItemsQuery = z.infer<typeof QueueItemsQuerySchema>;
export type ClearQueueQuery = z.infer<typeof ClearQueueQuerySchema>;

// ============================================================================
// API DATA TYPES
// ============================================================================

export type QueueStatusData = z.infer<typeof QueueStatusDataSchema>;
export type QueueOverviewData = z.infer<typeof QueueOverviewDataSchema>;
export type QueueDetailsData = z.infer<typeof QueueDetailsDataSchema>;
export type QueueItemData = z.infer<typeof QueueItemDataSchema>;
export type QueueActionResultData = z.infer<typeof QueueActionResultDataSchema>;
export type QueuesOverviewData = z.infer<typeof QueuesOverviewDataSchema>;
export type AllQueueJobsData = z.infer<typeof AllQueueJobsDataSchema>;
export type QueueItemsData = z.infer<typeof QueueItemsDataSchema>;
export type QueueClearResultData = z.infer<typeof QueueClearResultDataSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type GetQueuesStatusResponse = z.infer<typeof GetQueuesStatusResponseSchema>;
export type GetAllQueueJobsResponse = z.infer<typeof GetAllQueueJobsResponseSchema>;
export type GetQueueDetailsResponse = z.infer<typeof GetQueueDetailsResponseSchema>;
export type GetQueueItemsResponse = z.infer<typeof GetQueueItemsResponseSchema>;
export type PauseQueueResponse = z.infer<typeof PauseQueueResponseSchema>;
export type ResumeQueueResponse = z.infer<typeof ResumeQueueResponseSchema>;
export type ClearQueueResponse = z.infer<typeof ClearQueueResponseSchema>;
export type PurgeQueueResponse = z.infer<typeof PurgeQueueResponseSchema>;
export type RemoveQueueJobResponse = z.infer<typeof RemoveQueueJobResponseSchema>;
export type RetryQueueJobResponse = z.infer<typeof RetryQueueJobResponseSchema>;
export type QueuesApiErrorResponse = z.infer<typeof QueuesApiErrorResponseSchema>;
