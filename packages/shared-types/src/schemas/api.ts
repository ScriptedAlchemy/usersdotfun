import { z } from "zod";
import { CronExpressionParser } from "cron-parser";
import { jobSchema, jobRunInfoSchema } from './jobs';
import { jsonString } from '../utils/validators';

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const createJobSchema = jobSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    status: true,
    sourceConfig: true,
    sourceSearch: true,
    pipeline: true,
  })
  .extend({
    name: z.string().transform((val) => val.toLowerCase().replace(/\s+/g, "-")),
    schedule: z.string().refine(
      (val) => {
        try {
          CronExpressionParser.parse(val);
          return true;
        } catch (e) {
          return false;
        }
      },
      { message: "Invalid cron expression" }
    ).optional(),
    sourceConfig: jsonString.nullable(),
    sourceSearch: jsonString.nullable(),
    pipeline: jsonString.nullable(),
  });

export const updateJobSchema = createJobSchema.partial();

export const jobStatusResponseSchema = z.object({
  status: z.string(),
  queuePosition: z.number().optional(),
  estimatedStartTime: z.date().optional(),
  currentRun: jobRunInfoSchema.optional(),
});

export const jobRunDetailsResponseSchema = z.object({
  run: jobRunInfoSchema,
  pipelineItems: z.array(z.any()),
});

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateJob = z.infer<typeof createJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type JobStatusResponse = z.infer<typeof jobStatusResponseSchema>;
export type JobRunDetailsResponse = z.infer<typeof jobRunDetailsResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
