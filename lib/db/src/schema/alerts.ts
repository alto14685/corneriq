import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertPriorityEnum = pgEnum("alert_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const alertCategoryEnum = pgEnum("alert_category", [
  "inventory",
  "finance",
  "audit",
  "purchasing",
  "system",
]);

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: alertPriorityEnum("priority").notNull().default("medium"),
  category: alertCategoryEnum("category").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
