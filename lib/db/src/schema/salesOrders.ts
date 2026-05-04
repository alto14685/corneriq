import {
  pgTable,
  serial,
  text,
  decimal,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformEnum = pgEnum("platform", [
  "uber_eats",
  "deliveroo",
  "just_eat",
  "in_store",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
  "refunded",
]);

export type SalesOrderItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export const salesOrdersTable = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  platformOrderId: text("platform_order_id"),
  platform: platformEnum("platform").notNull(),
  status: orderStatusEnum("status").notNull().default("confirmed"),
  orderedAt: timestamp("ordered_at").notNull(),
  grossRevenue: decimal("gross_revenue", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull().default("0"),
  netRevenue: decimal("net_revenue", { precision: 10, scale: 2 }).notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  items: jsonb("items").notNull().$type<SalesOrderItem[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSalesOrderSchema = createInsertSchema(salesOrdersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;
export type SalesOrder = typeof salesOrdersTable.$inferSelect;
