import { relations } from "drizzle-orm";
import { json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { workflowRun } from "./workflow-run";

export const pipelineStep = pgTable("pipeline_step", {
  id: varchar("id", { length: 255 }).primaryKey(),
  runId: varchar("run_id", { length: 255 })
    .notNull()
    .references(() => workflowRun.id, { onDelete: "cascade" }),
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

export const pipelineStepRelations = relations(pipelineStep, ({ one }) => ({
  run: one(workflowRun, {
    fields: [pipelineStep.runId],
    references: [workflowRun.id],
  }),
}));

export type PipelineStep = typeof pipelineStep.$inferSelect;
export type NewPipelineStep = typeof pipelineStep.$inferInsert;
