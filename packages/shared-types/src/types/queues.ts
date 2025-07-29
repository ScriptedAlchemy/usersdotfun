import { z } from "zod";
import {
  jobStatusEnum,
  queueStatusEnum,
  jobTypeEnum,
  queueStatusSchema,
  jobStatusSchema,
  queueOverviewSchema,
  queueItemSchema,
  queueDetailsSchema,
  queueActionResultSchema,
} from '../schemas/queues';

// ============================================================================
// QUEUE MANAGEMENT ENUMS
// ============================================================================

export type JobStatusType = z.infer<typeof jobStatusEnum>;
export type QueueStatusType = z.infer<typeof queueStatusEnum>;
export type JobType = z.infer<typeof jobTypeEnum>;

// ============================================================================
// QUEUE MANAGEMENT TYPES
// ============================================================================

export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type QueueJobStatus = z.infer<typeof jobStatusSchema>;
export type QueueOverview = z.infer<typeof queueOverviewSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
export type QueueDetails = z.infer<typeof queueDetailsSchema>;
export type QueueActionResult = z.infer<typeof queueActionResultSchema>;
