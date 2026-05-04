import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const auditTypeEnum = pgEnum("audit_type", [
  "spot_check",
  "weekly",
  "monthly",
  "full",
]);

export const auditStatusEnum = pgEnum("audit_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const auditsTable = pgTable("audits", {
  id: serial("id").primaryKey(),
  auditType: auditTypeEnum("audit_type").notNull().default("spot_check"),
  status: auditStatusEnum("status").notNull().default("scheduled"),
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
  totalProductsAudited: integer("total_products_audited").default(0),
  totalVarianceValue: decimal("total_variance_value", { precision: 10, scale: 2 }).default("0"),
  shrinkageRate: decimal("shrinkage_rate", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditItemsTable = pgTable("audit_items", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id")
    .notNull()
    .references(() => auditsTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  productName: text("product_name").notNull(),
  sku: text("sku").notNull(),
  expectedQuantity: integer("expected_quantity").notNull(),
  actualQuantity: integer("actual_quantity"),
  variance: integer("variance"),
  variancePercent: decimal("variance_percent", { precision: 8, scale: 2 }),
  status: text("status").notNull().default("pending"),
  discrepancyCategory: text("discrepancy_category").default("none"),
});

export const insertAuditSchema = createInsertSchema(auditsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
export type AuditItem = typeof auditItemsTable.$inferSelect;
