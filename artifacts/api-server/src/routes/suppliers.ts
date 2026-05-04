import { Router } from "express";
import { eq } from "@workspace/db";
import { db, suppliersTable, insertSupplierSchema } from "@workspace/db";

export const suppliersRouter = Router();

suppliersRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(suppliersTable);
  res.json({ data: rows });
});

suppliersRouter.post("/", async (req, res) => {
  const parsed = insertSupplierSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }
  const [supplier] = await db
    .insert(suppliersTable)
    .values(parsed.data)
    .returning();
  res.status(201).json({ data: supplier });
});

suppliersRouter.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertSupplierSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }
  const [updated] = await db
    .update(suppliersTable)
    .set(parsed.data)
    .where(eq(suppliersTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Supplier not found" });
  res.json({ data: updated });
});
