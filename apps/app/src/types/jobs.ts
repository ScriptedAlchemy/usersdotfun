import { z } from 'zod';

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

export const jobWithStepsSchema = jobSchema.extend({
  steps: z.array(pipelineStepSchema),
});

export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;

export const createJobSchema = jobSchema.omit({ id: true, createdAt: true, updatedAt: true, status: true });
export type CreateJob = z.infer<typeof createJobSchema>;

export const updateJobSchema = createJobSchema.partial();
export type UpdateJob = z.infer<typeof updateJobSchema>;
