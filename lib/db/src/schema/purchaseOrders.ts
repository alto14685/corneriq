import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { suppliersTable } from "./suppliers";

export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "approved",
  "sent",
  "confirmed",
  "partially_received",
  "received",
  "cancelled",
]);

export type POItem = {
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliersTable.id),
  status: poStatusEnum("status").notNull().default("draft"),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }),
  expectedDeliveryDate: text("expected_delivery_date"),
  receivedDate: text("received_date"),
  notes: text("notes"),
  aiGenerated: boolean("ai_generated").default(false),
  items: jsonb("items").notNull().$type<POItem[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrdersTable.$inferSelect;
