import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { pipelineSteps } from "./pipeline-steps";

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schedule: varchar("schedule", { length: 255 }),
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

export const selectJobSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  schedule: z.string().nullable(),
  status: z.string(),
  sourcePlugin: z.string(),
  sourceConfig: z.any().nullable(),
  sourceSearch: z.any().nullable(),
  pipeline: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertJobSchema = z.object({
  id: z.uuid("Invalid UUID format for job ID").optional(),
  name: z.string().min(1),
  schedule: z.string().min(1).optional().nullable(),
  status: z.string().min(1).optional(),
  sourcePlugin: z.string().min(1),
  sourceConfig: z.any().optional().nullable(),
  sourceSearch: z.any().optional().nullable(),
  pipeline: z.any().optional().nullable(),
});

export const updateJobSchema = insertJobSchema.omit({ id: true }).partial();

export type SelectJob = z.infer<typeof selectJobSchema>;
export type InsertJobData = z.infer<typeof insertJobSchema>;
export type UpdateJobData = z.infer<typeof updateJobSchema>;
