import { Router } from "express";
import { eq, sql } from "@workspace/db";
import { db, inventoryTable, productsTable } from "@workspace/db";

export const inventoryRouter = Router();

inventoryRouter.get("/", async (req, res) => {
  const { stockStatus } = req.query as Record<string, string>;

  const rows = await db
    .select({
      id: inventoryTable.id,
      productId: inventoryTable.productId,
      quantityOnHand: inventoryTable.quantityOnHand,
      quantityOnOrder: inventoryTable.quantityOnOrder,
      lastCountedAt: inventoryTable.lastCountedAt,
      lastReceivedAt: inventoryTable.lastReceivedAt,
      updatedAt: inventoryTable.updatedAt,
      product: productsTable,
    })
    .from(inventoryTable)
    .innerJoin(productsTable, eq(inventoryTable.productId, productsTable.id));

  const withStatus = rows.map((row) => {
    const qty = parseFloat(row.quantityOnHand);
    const reorder = row.product.reorderPoint;
    let status: string;
    if (qty <= 0) status = "out_of_stock";
    else if (qty <= reorder) status = "low";
    else if (qty <= reorder * 1.5) status = "medium";
    else status = "ok";
    return { ...row, stockStatus: status };
  });

  const filtered = stockStatus
    ? withStatus.filter((r) => r.stockStatus === stockStatus)
    : withStatus;

  res.json({ data: filtered });
});

inventoryRouter.patch("/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId);
  const { adjustment, reason } = req.body as { adjustment: number; reason: string };

  if (typeof adjustment !== "number") {
    return res.status(400).json({ error: "adjustment must be a number" });
  }

  const [updated] = await db
    .update(inventoryTable)
    .set({
      quantityOnHand: sql`${inventoryTable.quantityOnHand} + ${adjustment}`,
      updatedAt: new Date(),
    })
    .where(eq(inventoryTable.productId, productId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Inventory not found" });
  res.json({ data: updated });
});
