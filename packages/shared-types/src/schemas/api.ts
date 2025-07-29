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
    ),
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
