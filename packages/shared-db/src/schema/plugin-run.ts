import { relations } from "drizzle-orm";
import { json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { workflowRun } from "./workflow-run";
import { sourceItem } from "./source-item";

export const pluginRun = pgTable("pipeline_step", {
  id: varchar("id", { length: 255 }).primaryKey(),
  workflowRunId: varchar("workflow_run_id", { length: 255 })
    .notNull()
    .references(() => workflowRun.id, { onDelete: "cascade" }),
  sourceItemId: varchar("source_item_id", { length: 255 })
    .references(() => sourceItem.id, { onDelete: "cascade" }),
  stepId: varchar("step_id", { length: 255 }).notNull(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull(),
  config: json("config"),
  input: json("input"),
  output: json("output"),
  error: json("error"),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true })
});

export const pluginRunRelations = relations(pluginRun, ({ one }) => ({
  workflowRun: one(workflowRun, {
    fields: [pluginRun.workflowRunId],
    references: [workflowRun.id],
  }),
  sourceItem: one(sourceItem, {
    fields: [pluginRun.sourceItemId],
    references: [sourceItem.id],
  }),
}));

export type PluginRun = typeof pluginRun.$inferSelect;
export type NewPluginRun = typeof pluginRun.$inferInsert;
