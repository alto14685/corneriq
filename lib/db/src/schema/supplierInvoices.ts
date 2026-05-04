import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { suppliersTable } from "./suppliers";

export const supplierInvoiceStatusEnum = pgEnum("supplier_invoice_status", [
  "pending_review",
  "approved",
  "synced_to_pos",
  "rejected",
]);

export type SupplierInvoiceItem = {
  sku: string;
  productName: string;
  invoicedQuantity: number;
  invoicedUnitPrice: number;
  vatRate: number;
  lineTotal: number;
  confidenceScore: number;
};

export const supplierInvoicesTable = pgTable("supplier_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number"),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  invoiceDate: text("invoice_date"),
  paymentTermsDays: integer("payment_terms_days").default(30),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  vatTotal: decimal("vat_total", { precision: 10, scale: 2 }),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }),
  status: supplierInvoiceStatusEnum("status").notNull().default("pending_review"),
  overallConfidenceScore: decimal("overall_confidence_score", { precision: 5, scale: 2 }),
  items: jsonb("items").notNull().$type<SupplierInvoiceItem[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSupplierInvoiceSchema = createInsertSchema(supplierInvoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSupplierInvoice = z.infer<typeof insertSupplierInvoiceSchema>;
export type SupplierInvoice = typeof supplierInvoicesTable.$inferSelect;
