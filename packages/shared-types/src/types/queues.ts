import { z } from "zod";
import {
  queueStatusSchema,
  queueOverviewSchema,
  queueItemSchema,
  queueDetailsSchema,
  queueActionResultSchema,
} from '../schemas/queues';

// ============================================================================
// QUEUE MANAGEMENT TYPES
// ============================================================================

export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type QueueOverview = z.infer<typeof queueOverviewSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
export type QueueDetails = z.infer<typeof queueDetailsSchema>;
export type QueueActionResult = z.infer<typeof queueActionResultSchema>;
