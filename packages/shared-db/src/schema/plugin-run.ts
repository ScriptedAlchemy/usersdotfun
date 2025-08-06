import { relations } from "drizzle-orm";
import { json, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { workflowRun } from "./workflow-run";
import { sourceItem } from "./source-item";
import { pluginRunStatusValues } from "@usersdotfun/shared-types/schemas";

export const pluginRunStatusEnum = pgEnum("plugin_run_status", pluginRunStatusValues);

export const pluginRun = pgTable("plugin_run", {
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
  status: pluginRunStatusEnum("status").notNull().default("PENDING"),
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

export type PluginRunEntity = typeof pluginRun.$inferSelect;
export type NewPluginRunEntity = typeof pluginRun.$inferInsert;
