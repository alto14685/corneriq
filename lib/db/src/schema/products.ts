import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("category", [
  "drinks",
  "snacks",
  "confectionery",
  "tobacco",
  "alcohol",
  "dairy",
  "frozen",
  "bakery",
  "household",
  "personal_care",
  "grocery",
  "other",
]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  subcategory: text("subcategory"),
  brand: text("brand"),
  unitOfMeasure: text("unit_of_measure").default("each"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("20"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
  sellPrice: decimal("sell_price", { precision: 10, scale: 2 }).notNull().default("0"),
  reorderPoint: integer("reorder_point").notNull().default(5),
  reorderQuantity: integer("reorder_quantity").notNull().default(10),
  preferredSupplierId: integer("preferred_supplier_id"),
  expiryTracking: boolean("expiry_tracking").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
