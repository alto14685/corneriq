import { Router } from "express";
import { eq, gte, inArray } from "@workspace/db";
import {
  db,
  salesOrdersTable,
  inventoryTable,
  productsTable,
  purchaseOrdersTable,
  alertsTable,
} from "@workspace/db";

export const dashboardRouter = Router();

const round2 = (n: number) => Math.round(n * 100) / 100;

dashboardRouter.get("/", async (_req, res) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  // Fetch all orders in last 14 days in one query
  const recentOrders = await db
    .select()
    .from(salesOrdersTable)
    .where(gte(salesOrdersTable.orderedAt, fourteenDaysAgo));

  const todayOrders = recentOrders.filter(
    (o) => new Date(o.orderedAt) >= todayStart,
  );
  const last7Orders = recentOrders.filter(
    (o) => new Date(o.orderedAt) >= sevenDaysAgo,
  );
  const prev7Orders = recentOrders.filter(
    (o) =>
      new Date(o.orderedAt) >= fourteenDaysAgo &&
      new Date(o.orderedAt) < sevenDaysAgo,
  );

  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + parseFloat(o.netRevenue),
    0,
  );
  const todayOrderCount = todayOrders.length;

  const last7Revenue = last7Orders.reduce(
    (sum, o) => sum + parseFloat(o.netRevenue),
    0,
  );
  const prev7Revenue = prev7Orders.reduce(
    (sum, o) => sum + parseFloat(o.netRevenue),
    0,
  );
  const revenueChange7d =
    prev7Revenue > 0
      ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100
      : 0;

  // Low stock count
  const invRows = await db
    .select({
      qty: inventoryTable.quantityOnHand,
      reorderPoint: productsTable.reorderPoint,
    })
    .from(inventoryTable)
    .innerJoin(
      productsTable,
      eq(inventoryTable.productId, productsTable.id),
    );

  const lowStockCount = invRows.filter(
    (r) => parseFloat(r.qty) <= r.reorderPoint,
  ).length;

  // Pending POs
  const pendingPOs = await db
    .select({ id: purchaseOrdersTable.id })
    .from(purchaseOrdersTable)
    .where(
      inArray(purchaseOrdersTable.status, ["draft", "approved", "sent"]),
    );

  // Unread alerts
  const unreadAlerts = await db
    .select({ id: alertsTable.id })
    .from(alertsTable)
    .where(eq(alertsTable.isRead, false));

  // Platform breakdown (last 7 days)
  const platforms = ["uber_eats", "deliveroo", "just_eat", "in_store"] as const;
  const commissionRates: Record<string, number> = {
    uber_eats: 0.30,
    deliveroo: 0.30,
    just_eat: 0.14,
    in_store: 0,
  };

  const platformBreakdown = platforms.map((platform) => {
    const orders = last7Orders.filter((o) => o.platform === platform);
    const grossRevenue = orders.reduce(
      (sum, o) => sum + parseFloat(o.grossRevenue),
      0,
    );
    const netRevenue = orders.reduce(
      (sum, o) => sum + parseFloat(o.netRevenue),
      0,
    );
    const commission = orders.reduce(
      (sum, o) => sum + parseFloat(o.commission),
      0,
    );
    return {
      platform,
      grossRevenue: round2(grossRevenue),
      netRevenue: round2(netRevenue),
      commission: round2(commission),
      orderCount: orders.length,
    };
  });

  // 7-day revenue chart (one entry per day)
  const revenueChart = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayOrders = last7Orders.filter((o) => {
      const t = new Date(o.orderedAt).getTime();
      return t >= date.getTime() && t < nextDate.getTime();
    });

    const entry: Record<string, number | string> = {
      date: date.toISOString().split("T")[0],
      uber_eats: 0,
      deliveroo: 0,
      just_eat: 0,
      in_store: 0,
      total: 0,
    };

    for (const o of dayOrders) {
      const net = parseFloat(o.netRevenue);
      (entry[o.platform] as number) += net;
      (entry.total as number) += net;
    }

    for (const key of platforms) {
      entry[key] = round2(entry[key] as number);
    }
    entry.total = round2(entry.total as number);

    return entry;
  });

  res.json({
    data: {
      todayRevenue: round2(todayRevenue),
      todayOrders: todayOrderCount,
      revenueChange7d: round2(revenueChange7d),
      lowStockCount,
      pendingPOCount: pendingPOs.length,
      unreadAlertCount: unreadAlerts.length,
      platformBreakdown,
      revenueChart,
    },
  });
});
