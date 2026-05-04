import { pgTable, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { productsTable } from "./products";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .unique()
    .references(() => productsTable.id),
  quantityOnHand: decimal("quantity_on_hand", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  quantityOnOrder: decimal("quantity_on_order", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  lastCountedAt: timestamp("last_counted_at"),
  lastReceivedAt: timestamp("last_received_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Inventory = typeof inventoryTable.$inferSelect;
