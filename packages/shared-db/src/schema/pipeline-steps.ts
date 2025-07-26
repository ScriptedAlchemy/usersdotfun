import { relations } from "drizzle-orm";
import { json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { jobs } from "./jobs";

export const pipelineSteps = pgTable("pipeline_steps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  jobId: varchar("job_id", { length: 255 })
    .notNull()
    .references(() => jobs.id),
  stepId: varchar("step_id", { length: 255 }).notNull(),
  pluginName: varchar("plugin_name", { length: 255 }).notNull(),
  config: json("config"),
  input: json("input"),
  output: json("output"),
  error: json("error"),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true })
});

export const pipelineStepsRelations = relations(pipelineSteps, ({ one }) => ({
  job: one(jobs, {
    fields: [pipelineSteps.jobId],
    references: [jobs.id],
  }),
}));

export type PipelineStep = typeof pipelineSteps.$inferSelect;
export type NewPipelineStep = typeof pipelineSteps.$inferInsert;

export const selectPipelineStepSchema = z.object({
  id: z.uuid(),
  jobId: z.uuid(),
  stepId: z.string().min(1),
  pluginName: z.string().min(1),
  config: z.any().nullable(),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  status: z.string().min(1),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

export const insertPipelineStepSchema = z.object({
  id: z.uuid("Invalid UUID format for step ID"),
  jobId: z.uuid(),
  stepId: z.string().min(1),
  pluginName: z.string().min(1),
  config: z.any().optional().nullable(),
  input: z.any().optional().nullable(),
  output: z.any().optional().nullable(),
  error: z.any().optional().nullable(),
  status: z.string().min(1),
  startedAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
});

export const updatePipelineStepSchema = insertPipelineStepSchema
  .partial()
  .required({ id: true });

export type SelectPipelineStep = z.infer<typeof selectPipelineStepSchema>;
export type InsertPipelineStepData = z.infer<typeof insertPipelineStepSchema>;
export type UpdatePipelineStepData = z.infer<typeof updatePipelineStepSchema>;