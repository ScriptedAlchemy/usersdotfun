import { z } from "zod";
import {
  createJobSchema,
  updateJobSchema,
  jobStatusResponseSchema,
  jobRunDetailsResponseSchema,
  apiErrorSchema,
} from '../schemas/api';

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export type CreateJob = z.infer<typeof createJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type JobStatusResponse = z.infer<typeof jobStatusResponseSchema>;
export type JobRunDetailsResponse = z.infer<typeof jobRunDetailsResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
