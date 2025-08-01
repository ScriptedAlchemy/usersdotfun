import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workflow } from "./workflow";
import { workflowRunStatusValues } from "@usersdotfun/shared-types/schemas";

export const workflowRunStatusEnum = pgEnum("workflow_run_status", workflowRunStatusValues);

// This is a single execution instance of a workflow.
export const workflowRun = pgTable("workflow_run", {
  id: varchar("id", { length: 255 }).primaryKey(), // The runId
  workflowId: varchar("workflow_id", { length: 255 })
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  triggeredBy: text("triggered_by").references(() => user.id, {
    onDelete: "set null",
  }),
  status: workflowRunStatusEnum("status").notNull().default("started"),
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

export type WorkflowRunEntity = typeof workflowRun.$inferSelect;
export type NewWorkflowRunEntity = typeof workflowRun.$inferInsert;