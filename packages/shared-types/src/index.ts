import { z } from "zod";
import { CronExpressionParser } from "cron-parser";

// ============================================================================
// PIPELINE & JOB TYPES
// ============================================================================

export const pipelineStepSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  stepId: z.string(),
  pluginName: z.string(),
  config: z.any().nullable(),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  status: z.string(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
});

export const jobSchema = z.object({
  id: z.string(),
  name: z.string(),
  schedule: z.string(),
  status: z.string(),
  sourcePlugin: z.string(),
  sourceConfig: z.any().nullable(),
  sourceSearch: z.any().nullable(),
  pipeline: z.any().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const jobRunInfoSchema = z.object({
  runId: z.string(),
  status: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  itemsProcessed: z.number(),
  itemsTotal: z.number(),
  state: z.any().optional(),
});

export const queueStatusSchema = z.object({
  name: z.string(),
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
  paused: z.boolean(),
});

export const jobStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.any(),
  progress: z.number(),
  attemptsMade: z.number(),
  timestamp: z.number(),
  processedOn: z.number().optional(),
  finishedOn: z.number().optional(),
  failedReason: z.string().optional(),
  returnvalue: z.any().optional(),
});

export const jobMonitoringDataSchema = z.object({
  job: jobSchema,
  currentState: z.any().optional(),
  queueStatus: z.object({
    sourceQueue: queueStatusSchema,
    pipelineQueue: queueStatusSchema,
  }),
  activeJobs: z.object({
    sourceJobs: z.array(jobStatusSchema),
    pipelineJobs: z.array(jobStatusSchema),
  }),
  recentRuns: z.array(jobRunInfoSchema),
  pipelineSteps: z.array(pipelineStepSchema),
});

export const jobWithStepsSchema = jobSchema.extend({
  steps: z.array(pipelineStepSchema),
});

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export const jwtPayloadSchema = z.object({
  id: z.string(),
  isAnonymous: z.boolean(),
  role: z.nativeEnum(UserRole),
  banned: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
});

export const authenticatedContextSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    role: z.nativeEnum(UserRole),
    isAnonymous: z.boolean().optional(),
    banned: z.boolean().optional(),
  }),
  session: z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
    token: z.string(),
  }),
});

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

const jsonString = z.string().transform((val, ctx) => {
  try {
    return JSON.parse(val);
  } catch (e) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid JSON",
    });
    return z.NEVER;
  }
});

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

// ============================================================================
// API ERROR SCHEMAS
// ============================================================================

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;
export type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
export type CreateJob = z.infer<typeof createJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;
export type AuthenticatedContext = z.infer<typeof authenticatedContextSchema>;
export type JobStatusResponse = z.infer<typeof jobStatusResponseSchema>;
export type JobRunDetailsResponse = z.infer<typeof jobRunDetailsResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
