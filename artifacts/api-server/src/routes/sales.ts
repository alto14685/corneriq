import { Router } from "express";
import { eq, gte, and } from "@workspace/db";
import { db, salesOrdersTable } from "@workspace/db";

export const salesRouter = Router();

const COMMISSION_RATES: Record<string, number> = {
  uber_eats: 0.30,
  deliveroo: 0.30,
  just_eat: 0.14,
  in_store: 0,
};

salesRouter.get("/summary", async (req, res) => {
  const days = parseInt((req.query.days as string) ?? "7");
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const orders = await db
    .select()
    .from(salesOrdersTable)
    .where(gte(salesOrdersTable.orderedAt, since));

  const byPlatform: Record<
    string,
    { grossRevenue: number; netRevenue: number; commission: number; orderCount: number }
  > = {};

  for (const o of orders) {
    const p = o.platform;
    if (!byPlatform[p]) {
      byPlatform[p] = { grossRevenue: 0, netRevenue: 0, commission: 0, orderCount: 0 };
    }
    byPlatform[p].grossRevenue += parseFloat(o.grossRevenue);
    byPlatform[p].netRevenue += parseFloat(o.netRevenue);
    byPlatform[p].commission += parseFloat(o.commission);
    byPlatform[p].orderCount += 1;
  }

  const data = Object.entries(byPlatform).map(([platform, stats]) => ({
    platform,
    ...stats,
  }));

  res.json({ data });
});

salesRouter.get("/top-products", async (req, res) => {
  const days = parseInt((req.query.days as string) ?? "7");
  const limit = parseInt((req.query.limit as string) ?? "10");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await db
    .select()
    .from(salesOrdersTable)
    .where(gte(salesOrdersTable.orderedAt, since));

  const productTotals: Record<
    number,
    { productId: number; totalQuantity: number; totalRevenue: number }
  > = {};

  for (const o of orders) {
    const items = (o.items ?? []) as Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
    for (const item of items) {
      if (!productTotals[item.productId]) {
        productTotals[item.productId] = {
          productId: item.productId,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productTotals[item.productId].totalQuantity += item.quantity;
      productTotals[item.productId].totalRevenue +=
        item.quantity * item.unitPrice;
    }
  }

  const sorted = Object.values(productTotals)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);

  res.json({ data: sorted });
});

salesRouter.get("/", async (req, res) => {
  const { platform, days } = req.query as Record<string, string>;
  const conditions = [];

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    conditions.push(gte(salesOrdersTable.orderedAt, since));
  }
  if (platform) {
    conditions.push(eq(salesOrdersTable.platform, platform as any));
  }

  const rows = await db
    .select()
    .from(salesOrdersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(salesOrdersTable.orderedAt);

  res.json({ data: rows });
});

salesRouter.post("/", async (req, res) => {
  const { platform, platformOrderId, orderedAt, grossRevenue, items } = req.body;
  const rate = COMMISSION_RATES[platform] ?? 0;
  const gross = parseFloat(grossRevenue);
  const commission = (gross * rate).toFixed(2);
  const netRevenue = (gross - parseFloat(commission)).toFixed(2);

  const [order] = await db
    .insert(salesOrdersTable)
    .values({
      platform,
      platformOrderId,
      orderedAt: orderedAt ? new Date(orderedAt) : new Date(),
      grossRevenue: gross.toFixed(2),
      commission,
      netRevenue,
      refundAmount: "0",
      items: items ?? [],
      status: "delivered",
    })
    .returning();

  res.status(201).json({ data: order });
});
