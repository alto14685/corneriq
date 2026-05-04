import { Router } from "express";
import { eq, like, and, lte } from "@workspace/db";
import { db, productsTable, inventoryTable, insertProductSchema } from "@workspace/db";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const { search, category, lowStock } = req.query as Record<string, string>;

  const conditions = [];
  if (search) conditions.push(like(productsTable.name, `%${search}%`));
  if (category) conditions.push(eq(productsTable.category, category));

  if (lowStock === "true") {
    const lowStockProducts = await db
      .select({ productId: inventoryTable.productId })
      .from(inventoryTable)
      .innerJoin(productsTable, eq(inventoryTable.productId, productsTable.id))
      .where(
        lte(
          inventoryTable.quantityOnHand,
          productsTable.reorderPoint.toString() as any,
        ),
      );

    const rows = await db
      .select()
      .from(productsTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const lowStockIds = new Set(lowStockProducts.map((r) => r.productId));
    const filtered = rows.filter((p) => lowStockIds.has(p.id));
    return res.json({ data: filtered });
  }

  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json({ data: rows });
});

productsRouter.post("/", async (req, res) => {
  const parsed = insertProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const [product] = await db
    .insert(productsTable)
    .values(parsed.data)
    .returning();

  // Auto-create inventory record
  await db.insert(inventoryTable).values({
    productId: product.id,
    quantityOnHand: "0",
    quantityOnOrder: "0",
  });

  res.status(201).json({ data: product });
});

productsRouter.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));

  if (!product) return res.status(404).json({ error: "Product not found" });

  const [inventory] = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.productId, id));

  res.json({ data: { ...product, inventory: inventory ?? null } });
});

productsRouter.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertProductSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const [updated] = await db
    .update(productsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(productsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.json({ data: updated });
});
