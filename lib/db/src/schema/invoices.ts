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

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "overdue",
  "disputed",
  "void",
]);

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
};

export type InvoicePayment = {
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
};

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  invoiceDate: text("invoice_date").notNull(),
  dueDate: text("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatTotal: decimal("vat_total", { precision: 10, scale: 2 }).notNull(),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  items: jsonb("items").notNull().$type<InvoiceLineItem[]>().default([]),
  payments: jsonb("payments").notNull().$type<InvoicePayment[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
