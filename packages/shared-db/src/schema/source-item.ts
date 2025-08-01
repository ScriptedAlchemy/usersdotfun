import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { workflow } from "./workflow";

export const sourceItem = pgTable("source_item", {
  id: varchar("id", { length: 255 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 255 })
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sourceItemRelations = relations(sourceItem, ({ one }) => ({
  workflow: one(workflow, {
    fields: [sourceItem.workflowId],
    references: [workflow.id],
  }),
}));

export type SourceItemEntity = typeof sourceItem.$inferSelect;
export type NewSourceItemEntity = typeof sourceItem.$inferInsert;