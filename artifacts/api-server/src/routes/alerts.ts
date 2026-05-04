import { Router } from "express";
import { eq } from "@workspace/db";
import { db, alertsTable } from "@workspace/db";

export const alertsRouter = Router();

alertsRouter.get("/", async (req, res) => {
  const { unreadOnly } = req.query as Record<string, string>;
  const rows =
    unreadOnly === "true"
      ? await db.select().from(alertsTable).where(eq(alertsTable.isRead, false))
      : await db.select().from(alertsTable);
  res.json({ data: rows });
});

alertsRouter.patch("/read-all", async (_req, res) => {
  const result = await db
    .update(alertsTable)
    .set({ isRead: true })
    .where(eq(alertsTable.isRead, false))
    .returning();
  res.json({ data: { updated: result.length } });
});

alertsRouter.patch("/:id/read", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(alertsTable)
    .set({ isRead: true })
    .where(eq(alertsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Alert not found" });
  res.json({ data: updated });
});
