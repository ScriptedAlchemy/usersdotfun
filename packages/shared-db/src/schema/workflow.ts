import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { sourceItem } from "./source-item";
import { workflowRun } from "./workflow-run";

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

export type Workflow = typeof workflow.$inferSelect;
export type NewWorkflow = typeof workflow.$inferInsert;