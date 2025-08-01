import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workflow } from "./workflow";

// This is a single execution instance of a workflow.
export const workflowRun = pgTable("workflow_run", {
  id: varchar("id", { length: 255 }).primaryKey(), // The runId
  workflowId: varchar("workflow_id", { length: 255 })
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  triggeredBy: text("triggered_by").references(() => user.id, {
    onDelete: "set null",
  }),
  status: varchar("status", { length: 50 }).notNull(), // e.g., 'started', 'completed', 'failed'
  itemsProcessed: integer("items_processed").default(0),
  itemsTotal: integer("items_total").default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const workflowRunRelations = relations(workflowRun, ({ one }) => ({
  workflow: one(workflow, {
    fields: [workflowRun.workflowId],
    references: [workflow.id],
  }),
  triggeredBy: one(user, {
    fields: [workflowRun.triggeredBy],
    references: [user.id],
  }),
}));

export type WorkflowRun = typeof workflowRun.$inferSelect;
export type NewWorkflowRun = typeof workflowRun.$inferInsert;