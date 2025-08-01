import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { workflowStatusValues } from "@usersdotfun/shared-types/schemas";
import { user } from "./auth";
import { sourceItem } from "./source-item";
import { workflowRun } from "./workflow-run";

export const workflowStatusEnum = pgEnum("workflow_status", workflowStatusValues);

// A workflow defines a source to query and a pipeline for the items
export const workflow = pgTable("workflow", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  schedule: varchar("schedule", { length: 255 }), // if null, run immediately
  source: jsonb("source").notNull(),
  pipeline: jsonb("pipeline").notNull(),
  status: workflowStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workflowRelations = relations(workflow, ({ many, one }) => ({
  user: one(user, {
    fields: [workflow.createdBy],
    references: [user.id],
  }),
  runs: many(workflowRun),
  items: many(sourceItem),
}));

export type WorkflowEntity = typeof workflow.$inferSelect;
export type NewWorkflowEntity = typeof workflow.$inferInsert;
