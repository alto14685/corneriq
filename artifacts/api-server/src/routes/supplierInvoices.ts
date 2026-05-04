import { Router } from "express";
import { eq, sql } from "@workspace/db";
import {
  db,
  supplierInvoicesTable,
  productsTable,
  inventoryTable,
} from "@workspace/db";

export const supplierInvoicesRouter = Router();

supplierInvoicesRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(supplierInvoicesTable);
  res.json({ data: rows });
});

supplierInvoicesRouter.post("/", async (req, res) => {
  const [invoice] = await db
    .insert(supplierInvoicesTable)
    .values(req.body)
    .returning();
  res.status(201).json({ data: invoice });
});

supplierInvoicesRouter.post("/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);

  const [invoice] = await db
    .select()
    .from(supplierInvoicesTable)
    .where(eq(supplierInvoicesTable.id, id));

  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  if (invoice.status === "synced_to_pos") {
    return res.status(400).json({ error: "Invoice already synced to POS" });
  }

  const items = (invoice.items ?? []) as Array<{
    sku: string;
    invoicedQuantity: number;
  }>;

  // Match each line item by SKU → update inventory.quantityOnHand
  for (const item of items) {
    const [product] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.sku, item.sku));

    if (product) {
      await db
        .update(inventoryTable)
        .set({
          quantityOnHand: sql`${inventoryTable.quantityOnHand} + ${item.invoicedQuantity}`,
          lastReceivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(inventoryTable.productId, product.id));
    }
  }

  const [updated] = await db
    .update(supplierInvoicesTable)
    .set({ status: "synced_to_pos", updatedAt: new Date() })
    .where(eq(supplierInvoicesTable.id, id))
    .returning();

  res.json({ data: updated });
});
