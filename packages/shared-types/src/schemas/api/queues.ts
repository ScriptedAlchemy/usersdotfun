import { z } from "zod";
import {
  jobTypeEnum,
  queueActionResultSchema,
  queueDetailsSchema,
  queueItemSchema,
  queueOverviewSchema,
  queueStatusSchema
} from "../queues";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  PaginatedDataSchema,
  SimpleMessageDataSchema
} from "./common";

// ============================================================================
// QUEUE API REQUEST SCHEMAS
// ============================================================================

// URL Parameters
export const QueueNameParamSchema = z.object({
  queueName: z.string().min(1),
});

export const QueueJobParamsSchema = z.object({
  queueName: z.string().min(1),
  jobId: z.string().min(1),
});

// Query Parameters
export const QueuesStatusQuerySchema = z.object({});

export const QueueJobsQuerySchema = z.object({
  status: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(1000).optional()),
});

export const QueueItemsQuerySchema = z.object({
  status: z.string().default("waiting"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).optional()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(100).optional()),
});

export const ClearQueueQuerySchema = z.object({
  type: jobTypeEnum.optional(),
});

// ============================================================================
// QUEUE API RESPONSE SCHEMAS
// ============================================================================

// Success Response Data Schemas
export const QueueStatusDataSchema = queueStatusSchema;
export const QueueOverviewDataSchema = queueOverviewSchema;
export const QueueDetailsDataSchema = queueDetailsSchema;
export const QueueItemDataSchema = queueItemSchema;
export const QueueActionResultDataSchema = queueActionResultSchema;

export const QueuesOverviewDataSchema = z.object({
  queues: z.record(z.string(), QueueOverviewDataSchema),
  timestamp: z.string().datetime(),
});

export const AllQueueJobsDataSchema = z.object({
  jobs: z.array(
    QueueItemDataSchema.extend({
      queueName: z.string(),
      status: z.string(),
    })
  ),
  total: z.number(),
});

export const QueueItemsDataSchema = PaginatedDataSchema(QueueItemDataSchema);

export const QueueClearResultDataSchema = z.object({
  message: z.string(),
  itemsRemoved: z.number(),
});

// ============================================================================
// COMPLETE API CONTRACT SCHEMAS
// ============================================================================

// GET /queues/status
export const GetQueuesStatusRequestSchema = z.object({
  query: QueuesStatusQuerySchema,
});
export const GetQueuesStatusResponseSchema = ApiSuccessResponseSchema(QueuesOverviewDataSchema);

// GET /queues/jobs
export const GetAllQueueJobsRequestSchema = z.object({
  query: QueueJobsQuerySchema,
});
export const GetAllQueueJobsResponseSchema = ApiSuccessResponseSchema(AllQueueJobsDataSchema);

// GET /queues/:queueName
export const GetQueueDetailsRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const GetQueueDetailsResponseSchema = ApiSuccessResponseSchema(QueueDetailsDataSchema);

// GET /queues/:queueName/items
export const GetQueueItemsRequestSchema = z.object({
  params: QueueNameParamSchema,
  query: QueueItemsQuerySchema,
});
export const GetQueueItemsResponseSchema = ApiSuccessResponseSchema(QueueItemsDataSchema);

// POST /queues/:queueName/pause
export const PauseQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const PauseQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /queues/:queueName/resume
export const ResumeQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const ResumeQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// DELETE /queues/:queueName/clear
export const ClearQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
  query: ClearQueueQuerySchema,
});
export const ClearQueueResponseSchema = ApiSuccessResponseSchema(QueueClearResultDataSchema);

// DELETE /queues/:queueName/purge
export const PurgeQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const PurgeQueueResponseSchema = ApiSuccessResponseSchema(QueueClearResultDataSchema);

// DELETE /queues/:queueName/jobs/:jobId
export const RemoveQueueJobRequestSchema = z.object({
  params: QueueJobParamsSchema,
});
export const RemoveQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /queues/:queueName/jobs/:jobId/retry
export const RetryQueueJobRequestSchema = z.object({
  params: QueueJobParamsSchema,
});
export const RetryQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// ============================================================================
// ERROR RESPONSE SCHEMAS
// ============================================================================

export const QueuesApiErrorResponseSchema = ApiErrorResponseSchema;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QueueNameParam = z.infer<typeof QueueNameParamSchema>;
export type QueueJobParams = z.infer<typeof QueueJobParamsSchema>;
export type QueuesStatusQuery = z.infer<typeof QueuesStatusQuerySchema>;
export type QueueJobsQuery = z.infer<typeof QueueJobsQuerySchema>;
export type QueueItemsQuery = z.infer<typeof QueueItemsQuerySchema>;
export type ClearQueueQuery = z.infer<typeof ClearQueueQuerySchema>;

export type QueueStatusData = z.infer<typeof QueueStatusDataSchema>;
export type QueueOverviewData = z.infer<typeof QueueOverviewDataSchema>;
export type QueueDetailsData = z.infer<typeof QueueDetailsDataSchema>;
export type QueueItemData = z.infer<typeof QueueItemDataSchema>;
export type QueueActionResultData = z.infer<typeof QueueActionResultDataSchema>;
export type QueuesOverviewData = z.infer<typeof QueuesOverviewDataSchema>;
export type AllQueueJobsData = z.infer<typeof AllQueueJobsDataSchema>;
export type QueueItemsData = z.infer<typeof QueueItemsDataSchema>;
export type QueueClearResultData = z.infer<typeof QueueClearResultDataSchema>;

// Response Types
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
