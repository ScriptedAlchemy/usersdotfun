import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { pipelineSteps } from "./pipeline-steps";

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schedule: varchar("schedule", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  sourcePlugin: varchar("source_plugin", { length: 255 }).notNull(),
  sourceConfig: jsonb("source_config"),
  sourceSearch: jsonb("source_search"),
  pipeline: jsonb("pipeline"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ many }) => ({
  steps: many(pipelineSteps),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export const selectJobSchema = createSelectSchema(jobs);

export const insertJobSchema = createInsertSchema(jobs, {
  id: z.string().uuid("Invalid UUID format for job ID"),
  sourceConfig: z.any(),
  sourceSearch: z.any(),
  pipeline: z.any(),
});

export const updateJobSchema = insertJobSchema
  .partial()
  .required({ id: true });

export type SelectJob = z.infer<typeof selectJobSchema>;
export type InsertJobData = z.infer<typeof insertJobSchema>;
export type UpdateJobData = z.infer<typeof updateJobSchema>;
