import { Router } from "express";
import { eq } from "@workspace/db";
import { db, purchaseOrdersTable } from "@workspace/db";
import { nextPONumber } from "../lib/sequences";

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const rows = status
    ? await db
        .select()
        .from(purchaseOrdersTable)
        .where(eq(purchaseOrdersTable.status, status as any))
    : await db.select().from(purchaseOrdersTable);
  res.json({ data: rows });
});

purchaseOrdersRouter.post("/", async (req, res) => {
  const { supplierId, expectedDeliveryDate, notes, items } = req.body;
  const poNumber = await nextPONumber();

  const totalValue = (
    (items as Array<{ lineTotal: number }>).reduce(
      (sum, i) => sum + i.lineTotal,
      0,
    )
  ).toFixed(2);

  const [po] = await db
    .insert(purchaseOrdersTable)
    .values({
      poNumber,
      supplierId,
      status: "draft",
      totalValue,
      expectedDeliveryDate,
      notes,
      items: items ?? [],
    })
    .returning();

  res.status(201).json({ data: po });
});

purchaseOrdersRouter.patch("/:id/status", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body as { status: string };

  const [updated] = await db
    .update(purchaseOrdersTable)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(purchaseOrdersTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Purchase order not found" });
  res.json({ data: updated });
});
