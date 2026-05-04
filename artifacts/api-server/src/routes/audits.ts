import { Router } from "express";
import { eq } from "@workspace/db";
import {
  db,
  auditsTable,
  auditItemsTable,
  inventoryTable,
  productsTable,
} from "@workspace/db";

export const auditsRouter = Router();

auditsRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(auditsTable);
  res.json({ data: rows });
});

auditsRouter.post("/", async (req, res) => {
  const { auditType, scheduledFor, notes } = req.body;

  const [audit] = await db
    .insert(auditsTable)
    .values({
      auditType,
      status: "in_progress",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      notes,
    })
    .returning();

  // Auto-populate audit items from current inventory
  const inventory = await db
    .select({
      productId: inventoryTable.productId,
      quantityOnHand: inventoryTable.quantityOnHand,
      name: productsTable.name,
      sku: productsTable.sku,
    })
    .from(inventoryTable)
    .innerJoin(productsTable, eq(inventoryTable.productId, productsTable.id));

  if (inventory.length > 0) {
    await db.insert(auditItemsTable).values(
      inventory.map((inv) => ({
        auditId: audit.id,
        productId: inv.productId,
        productName: inv.name,
        sku: inv.sku,
        expectedQuantity: Math.round(parseFloat(inv.quantityOnHand)),
        status: "pending",
        discrepancyCategory: "none",
      })),
    );
  }

  const items = await db
    .select()
    .from(auditItemsTable)
    .where(eq(auditItemsTable.auditId, audit.id));

  res.status(201).json({ data: { ...audit, items } });
});

auditsRouter.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [audit] = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.id, id));

  if (!audit) return res.status(404).json({ error: "Audit not found" });

  const items = await db
    .select()
    .from(auditItemsTable)
    .where(eq(auditItemsTable.auditId, id));

  res.json({ data: { ...audit, items } });
});

auditsRouter.patch("/:id/items/:itemId", async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const { actualQuantity, discrepancyCategory } = req.body as {
    actualQuantity: number;
    discrepancyCategory?: string;
  };

  const [item] = await db
    .select()
    .from(auditItemsTable)
    .where(eq(auditItemsTable.id, itemId));

  if (!item) return res.status(404).json({ error: "Audit item not found" });

  const variance = actualQuantity - item.expectedQuantity;
  const variancePercent =
    item.expectedQuantity > 0
      ? ((variance / item.expectedQuantity) * 100).toFixed(2)
      : "0";

  const status =
    variance === 0
      ? "match"
      : Math.abs(variance) <= 2
        ? "minor_variance"
        : "significant_variance";

  const [updated] = await db
    .update(auditItemsTable)
    .set({
      actualQuantity,
      variance,
      variancePercent,
      status,
      discrepancyCategory: discrepancyCategory ?? (variance < 0 ? "shrinkage" : "none"),
    })
    .where(eq(auditItemsTable.id, itemId))
    .returning();

  res.json({ data: updated });
});

auditsRouter.post("/:id/complete", async (req, res) => {
  const id = parseInt(req.params.id);

  const items = await db
    .select()
    .from(auditItemsTable)
    .where(eq(auditItemsTable.auditId, id));

  // Recalculate variance for all items and compute totals
  let totalVarianceValue = 0;
  let totalExpectedValue = 0;

  for (const item of items) {
    const [product] = await db
      .select({ costPrice: productsTable.costPrice })
      .from(productsTable)
      .where(eq(productsTable.id, item.productId));

    const costPrice = product ? parseFloat(product.costPrice) : 0;
    const variance = (item.actualQuantity ?? item.expectedQuantity) - item.expectedQuantity;
    const varianceValue = Math.abs(variance) * costPrice;

    totalVarianceValue += varianceValue;
    totalExpectedValue += item.expectedQuantity * costPrice;

    // Update variance on item
    if (item.actualQuantity !== null && item.actualQuantity !== undefined) {
      const variancePercent =
        item.expectedQuantity > 0
          ? ((variance / item.expectedQuantity) * 100).toFixed(2)
          : "0";
      await db
        .update(auditItemsTable)
        .set({
          variance,
          variancePercent,
          status:
            variance === 0
              ? "match"
              : Math.abs(variance) <= 2
                ? "minor_variance"
                : "significant_variance",
        })
        .where(eq(auditItemsTable.id, item.id));
    }
  }

  const shrinkageRate =
    totalExpectedValue > 0
      ? ((totalVarianceValue / totalExpectedValue) * 100).toFixed(2)
      : "0";

  const [completed] = await db
    .update(auditsTable)
    .set({
      status: "completed",
      completedAt: new Date(),
      totalProductsAudited: items.length,
      totalVarianceValue: totalVarianceValue.toFixed(2),
      shrinkageRate,
    })
    .where(eq(auditsTable.id, id))
    .returning();

  res.json({ data: completed });
});
