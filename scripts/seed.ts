import "dotenv/config";
import {
  db,
  productsTable,
  suppliersTable,
  inventoryTable,
  salesOrdersTable,
  purchaseOrdersTable,
  supplierInvoicesTable,
  auditsTable,
  auditItemsTable,
  invoicesTable,
  alertsTable,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Suppliers ────────────────────────────────────────────────────────────
  const [booker, bestway, nisa] = await db
    .insert(suppliersTable)
    .values([
      {
        name: "Booker Wholesale",
        contactName: "Mark Johnson",
        email: "orders@booker.co.uk",
        phone: "0800 123 4567",
        address: "Booker House, Equity Avenue, Hemel Hempstead, HP2 4EW",
        vatNumber: "GB123456001",
        paymentTermsDays: 30,
        leadTimeDays: 2,
      },
      {
        name: "Bestway Cash & Carry",
        contactName: "Sarah Ahmed",
        email: "orders@bestway.co.uk",
        phone: "0800 234 5678",
        address: "Bestway House, Abbey Road, Park Royal, London, NW10 7BW",
        vatNumber: "GB123456002",
        paymentTermsDays: 14,
        leadTimeDays: 1,
      },
      {
        name: "Nisa Retail",
        contactName: "David Smith",
        email: "orders@nisa.co.uk",
        phone: "0800 345 6789",
        address: "Nisa Retail Ltd, Scunthorpe, DN16 1AR",
        vatNumber: "GB123456003",
        paymentTermsDays: 30,
        leadTimeDays: 3,
      },
    ])
    .returning();

  console.log("✅ Suppliers seeded");

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = await db
    .insert(productsTable)
    .values([
      {
        sku: "CC-330",
        barcode: "5000112637922",
        name: "Coca-Cola 330ml",
        category: "drinks",
        brand: "Coca-Cola",
        unitOfMeasure: "can",
        vatRate: "20",
        costPrice: "0.45",
        sellPrice: "1.20",
        reorderPoint: 50,
        reorderQuantity: 144,
        preferredSupplierId: booker.id,
      },
      {
        sku: "RB-250",
        barcode: "9002490100070",
        name: "Red Bull 250ml",
        category: "drinks",
        brand: "Red Bull",
        unitOfMeasure: "can",
        vatRate: "20",
        costPrice: "0.75",
        sellPrice: "2.00",
        reorderPoint: 30,
        reorderQuantity: 48,
        preferredSupplierId: booker.id,
      },
      {
        sku: "WC-150",
        barcode: "5000328108090",
        name: "Walkers Ready Salted 150g",
        category: "snacks",
        brand: "Walkers",
        unitOfMeasure: "bag",
        vatRate: "0",
        costPrice: "0.35",
        sellPrice: "0.90",
        reorderPoint: 40,
        reorderQuantity: 60,
        preferredSupplierId: bestway.id,
      },
      {
        sku: "KK-4F",
        barcode: "5000159461122",
        name: "Kit Kat 4 Finger",
        category: "confectionery",
        brand: "Nestlé",
        unitOfMeasure: "each",
        vatRate: "0",
        costPrice: "0.40",
        sellPrice: "1.00",
        reorderPoint: 40,
        reorderQuantity: 48,
        preferredSupplierId: bestway.id,
      },
      {
        sku: "RB-500",
        barcode: "5000171135609",
        name: "Ribena Original 500ml",
        category: "drinks",
        brand: "Ribena",
        unitOfMeasure: "bottle",
        vatRate: "20",
        costPrice: "0.55",
        sellPrice: "1.50",
        reorderPoint: 50,
        reorderQuantity: 60,
        preferredSupplierId: booker.id,
      },
      {
        sku: "LZ-500",
        barcode: "5000159449212",
        name: "Lucozade Original 500ml",
        category: "drinks",
        brand: "Lucozade",
        unitOfMeasure: "bottle",
        vatRate: "20",
        costPrice: "0.60",
        sellPrice: "1.80",
        reorderPoint: 50,
        reorderQuantity: 60,
        preferredSupplierId: booker.id,
      },
      {
        sku: "ML-2L",
        barcode: "5057545078428",
        name: "Semi-Skimmed Milk 2L",
        category: "dairy",
        brand: "Müller",
        unitOfMeasure: "bottle",
        vatRate: "0",
        costPrice: "0.85",
        sellPrice: "1.75",
        reorderPoint: 40,
        reorderQuantity: 48,
        preferredSupplierId: nisa.id,
      },
      {
        sku: "WB-800",
        barcode: "5000336027419",
        name: "Warburtons White Bread 800g",
        category: "bakery",
        brand: "Warburtons",
        unitOfMeasure: "loaf",
        vatRate: "0",
        costPrice: "0.75",
        sellPrice: "1.50",
        reorderPoint: 30,
        reorderQuantity: 24,
        preferredSupplierId: nisa.id,
      },
      {
        sku: "HR-175",
        barcode: "4001686511022",
        name: "Haribo Starmix 175g",
        category: "confectionery",
        brand: "Haribo",
        unitOfMeasure: "bag",
        vatRate: "0",
        costPrice: "0.60",
        sellPrice: "1.50",
        reorderPoint: 30,
        reorderQuantity: 36,
        preferredSupplierId: bestway.id,
      },
      {
        sku: "RS-400",
        barcode: "5017338106213",
        name: "Richmond Thick Sausages 400g",
        category: "grocery",
        brand: "Richmond",
        unitOfMeasure: "pack",
        vatRate: "0",
        costPrice: "1.20",
        sellPrice: "2.50",
        reorderPoint: 20,
        reorderQuantity: 24,
        preferredSupplierId: nisa.id,
      },
    ])
    .returning();

  console.log("✅ Products seeded");

  // ─── Inventory ────────────────────────────────────────────────────────────
  const inventoryQuantities: Record<string, number> = {
    "CC-330": 150,
    "RB-250": 80,
    "WC-150": 200,
    "KK-4F": 100,
    "RB-500": 60,
    "LZ-500": 45,  // low stock (reorder point 50)
    "ML-2L": 30,   // low stock (reorder point 40)
    "WB-800": 22,  // low stock (reorder point 30)
    "HR-175": 120,
    "RS-400": 50,
  };

  await db.insert(inventoryTable).values(
    products.map((p) => ({
      productId: p.id,
      quantityOnHand: (inventoryQuantities[p.sku] ?? 50).toString(),
      quantityOnOrder: "0",
      lastCountedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    })),
  );

  console.log("✅ Inventory seeded");

  // ─── Sales Orders (~300 across 30 days) ──────────────────────────────────
  const platforms = ["uber_eats", "deliveroo", "just_eat", "in_store"] as const;
  const commissionRates: Record<string, number> = {
    uber_eats: 0.30,
    deliveroo: 0.30,
    just_eat: 0.14,
    in_store: 0,
  };

  const salesOrders: Parameters<typeof db.insert>[1] extends (infer T)[]
    ? T[]
    : never[] = [];

  const now = new Date();
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    // 8-12 orders per day
    const ordersPerDay = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < ordersPerDay; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const hour = 10 + Math.floor(Math.random() * 10);
      const orderedAt = new Date(date);
      orderedAt.setHours(hour, Math.floor(Math.random() * 60));

      const grossRevenue = (5 + Math.random() * 40).toFixed(2);
      const commissionRate = commissionRates[platform];
      const commission = (parseFloat(grossRevenue) * commissionRate).toFixed(2);
      const netRevenue = (parseFloat(grossRevenue) - parseFloat(commission)).toFixed(2);

      salesOrders.push({
        platform,
        status: "delivered" as const,
        orderedAt,
        grossRevenue,
        commission,
        netRevenue,
        refundAmount: "0",
        items: [],
        platformOrderId: `${platform.toUpperCase()}-${Date.now()}-${i}`,
      });
    }
  }

  await db.insert(salesOrdersTable).values(salesOrders as any);
  console.log(`✅ ${salesOrders.length} sales orders seeded`);

  // ─── Purchase Orders ──────────────────────────────────────────────────────
  const [po1, po2, po3] = await db
    .insert(purchaseOrdersTable)
    .values([
      {
        poNumber: "PO-2026-001",
        supplierId: booker.id,
        status: "received" as const,
        totalValue: "487.50",
        expectedDeliveryDate: "2026-04-15",
        receivedDate: "2026-04-15",
        notes: "Regular weekly order",
        items: [
          { productId: products[0].id, sku: "CC-330", productName: "Coca-Cola 330ml", quantity: 144, unitCost: 0.45, lineTotal: 64.80 },
          { productId: products[1].id, sku: "RB-250", productName: "Red Bull 250ml", quantity: 48, unitCost: 0.75, lineTotal: 36.00 },
          { productId: products[4].id, sku: "RB-500", productName: "Ribena Original 500ml", quantity: 60, unitCost: 0.55, lineTotal: 33.00 },
          { productId: products[5].id, sku: "LZ-500", productName: "Lucozade Original 500ml", quantity: 60, unitCost: 0.60, lineTotal: 36.00 },
        ],
      },
      {
        poNumber: "PO-2026-002",
        supplierId: bestway.id,
        status: "approved" as const,
        totalValue: "312.00",
        expectedDeliveryDate: "2026-05-06",
        notes: "Snacks restock",
        items: [
          { productId: products[2].id, sku: "WC-150", productName: "Walkers Ready Salted 150g", quantity: 60, unitCost: 0.35, lineTotal: 21.00 },
          { productId: products[3].id, sku: "KK-4F", productName: "Kit Kat 4 Finger", quantity: 48, unitCost: 0.40, lineTotal: 19.20 },
          { productId: products[8].id, sku: "HR-175", productName: "Haribo Starmix 175g", quantity: 36, unitCost: 0.60, lineTotal: 21.60 },
        ],
      },
      {
        poNumber: "PO-2026-003",
        supplierId: nisa.id,
        status: "draft" as const,
        notes: "Perishables — confirm before sending",
        items: [
          { productId: products[6].id, sku: "ML-2L", productName: "Semi-Skimmed Milk 2L", quantity: 48, unitCost: 0.85, lineTotal: 40.80 },
          { productId: products[7].id, sku: "WB-800", productName: "Warburtons White Bread 800g", quantity: 24, unitCost: 0.75, lineTotal: 18.00 },
          { productId: products[9].id, sku: "RS-400", productName: "Richmond Thick Sausages 400g", quantity: 24, unitCost: 1.20, lineTotal: 28.80 },
        ],
      },
    ])
    .returning();

  console.log("✅ Purchase orders seeded");

  // ─── Supplier Invoices ────────────────────────────────────────────────────
  await db.insert(supplierInvoicesTable).values([
    {
      invoiceNumber: "BKR-2026-4521",
      supplierId: booker.id,
      invoiceDate: "2026-04-28",
      paymentTermsDays: 30,
      subtotal: "170.00",
      vatTotal: "34.00",
      grandTotal: "204.00",
      status: "pending_review" as const,
      overallConfidenceScore: "87.50",
      items: [
        { sku: "CC-330", productName: "Coca-Cola 330ml", invoicedQuantity: 144, invoicedUnitPrice: 0.45, vatRate: 20, lineTotal: 77.76, confidenceScore: 95 },
        { sku: "RB-250", productName: "Red Bull 250ml", invoicedQuantity: 48, invoicedUnitPrice: 0.78, vatRate: 20, lineTotal: 44.93, confidenceScore: 72 },
        { sku: "LZ-500", productName: "Lucozade Original 500ml", invoicedQuantity: 60, invoicedUnitPrice: 0.60, vatRate: 20, lineTotal: 43.20, confidenceScore: 96 },
      ],
    },
    {
      invoiceNumber: "BST-2026-8834",
      supplierId: bestway.id,
      invoiceDate: "2026-04-30",
      paymentTermsDays: 14,
      subtotal: "61.80",
      vatTotal: "0.00",
      grandTotal: "61.80",
      status: "pending_review" as const,
      overallConfidenceScore: "62.00",
      items: [
        { sku: "WC-150", productName: "Walkers Crisps 150g", invoicedQuantity: 60, invoicedUnitPrice: 0.35, vatRate: 0, lineTotal: 21.00, confidenceScore: 88 },
        { sku: "KK-4F", productName: "Kit Kat 4 Finger", invoicedQuantity: 48, invoicedUnitPrice: 0.42, vatRate: 0, lineTotal: 20.16, confidenceScore: 45 },
        { sku: "HR-175", productName: "Haribo Starmix 175g", invoicedQuantity: 36, invoicedUnitPrice: 0.60, vatRate: 0, lineTotal: 21.60, confidenceScore: 91 },
      ],
    },
    {
      invoiceNumber: "NSA-2026-1102",
      supplierId: nisa.id,
      invoiceDate: "2026-04-15",
      paymentTermsDays: 30,
      subtotal: "87.60",
      vatTotal: "0.00",
      grandTotal: "87.60",
      status: "synced_to_pos" as const,
      overallConfidenceScore: "96.00",
      items: [
        { sku: "ML-2L", productName: "Semi-Skimmed Milk 2L", invoicedQuantity: 48, invoicedUnitPrice: 0.85, vatRate: 0, lineTotal: 40.80, confidenceScore: 98 },
        { sku: "WB-800", productName: "Warburtons White Bread 800g", invoicedQuantity: 24, invoicedUnitPrice: 0.75, vatRate: 0, lineTotal: 18.00, confidenceScore: 97 },
        { sku: "RS-400", productName: "Richmond Thick Sausages 400g", invoicedQuantity: 24, invoicedUnitPrice: 1.20, vatRate: 0, lineTotal: 28.80, confidenceScore: 94 },
      ],
    },
  ]);

  console.log("✅ Supplier invoices seeded");

  // ─── Audits ───────────────────────────────────────────────────────────────
  const [completedAudit, scheduledAudit, inProgressAudit] = await db
    .insert(auditsTable)
    .values([
      {
        auditType: "weekly" as const,
        status: "completed" as const,
        scheduledFor: new Date("2026-04-26T09:00:00Z"),
        completedAt: new Date("2026-04-26T11:30:00Z"),
        totalProductsAudited: 10,
        totalVarianceValue: "12.50",
        shrinkageRate: "1.20",
        notes: "Minor shrinkage on drinks — noted and investigating",
      },
      {
        auditType: "monthly" as const,
        status: "scheduled" as const,
        scheduledFor: new Date("2026-05-10T09:00:00Z"),
        notes: "Full monthly stock audit",
      },
      {
        auditType: "spot_check" as const,
        status: "in_progress" as const,
        scheduledFor: new Date(),
        notes: "Random spot check on high-value items",
      },
    ])
    .returning();

  // Audit items for completed audit
  await db.insert(auditItemsTable).values(
    products.map((p) => {
      const expected = inventoryQuantities[p.sku] ?? 50;
      const variance = Math.floor(Math.random() * 5) - 2;
      const actual = Math.max(0, expected + variance);
      const variancePercent = expected > 0
        ? ((actual - expected) / expected * 100).toFixed(2)
        : "0";
      const status =
        variance === 0 ? "match" :
        Math.abs(variance) <= 2 ? "minor_variance" : "significant_variance";
      return {
        auditId: completedAudit.id,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        expectedQuantity: expected,
        actualQuantity: actual,
        variance,
        variancePercent,
        status,
        discrepancyCategory: variance < 0 ? "shrinkage" : "none",
      };
    }),
  );

  // Audit items for in-progress audit (only a few products, some pending)
  await db.insert(auditItemsTable).values(
    products.slice(0, 5).map((p, i) => {
      const expected = inventoryQuantities[p.sku] ?? 50;
      if (i < 3) {
        const actual = expected - 1;
        return {
          auditId: inProgressAudit.id,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          expectedQuantity: expected,
          actualQuantity: actual,
          variance: -1,
          variancePercent: expected > 0 ? ((-1 / expected) * 100).toFixed(2) : "0",
          status: "minor_variance",
          discrepancyCategory: "shrinkage",
        };
      }
      return {
        auditId: inProgressAudit.id,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        expectedQuantity: expected,
        status: "pending",
        discrepancyCategory: "none",
      };
    }),
  );

  console.log("✅ Audits seeded");

  // ─── Outbound Invoices ────────────────────────────────────────────────────
  await db.insert(invoicesTable).values([
    {
      invoiceNumber: "INV-2026-001",
      customerName: "Manchester City Catering Ltd",
      customerEmail: "accounts@mccatering.co.uk",
      status: "paid" as const,
      invoiceDate: "2026-04-01",
      dueDate: "2026-05-01",
      subtotal: "450.00",
      vatTotal: "90.00",
      grandTotal: "540.00",
      amountPaid: "540.00",
      amountDue: "0.00",
      notes: "Monthly supply agreement — April",
      items: [
        { description: "Coca-Cola 330ml × 144", quantity: 144, unitPrice: 1.20, vatRate: 20, lineTotal: 172.80 },
        { description: "Red Bull 250ml × 48", quantity: 48, unitPrice: 2.00, vatRate: 20, lineTotal: 96.00 },
        { description: "Walkers Crisps × 60", quantity: 60, unitPrice: 0.90, vatRate: 0, lineTotal: 54.00 },
        { description: "Kit Kat × 48", quantity: 48, unitPrice: 1.00, vatRate: 0, lineTotal: 48.00 },
      ],
      payments: [
        { amount: 540.00, method: "bank_transfer", reference: "BAC-2026-04-01", paidAt: "2026-04-03" },
      ],
    },
    {
      invoiceNumber: "INV-2026-002",
      customerName: "Salford Sports Club",
      customerEmail: "finance@salfordsportsclub.co.uk",
      status: "sent" as const,
      invoiceDate: "2026-04-20",
      dueDate: "2026-05-20",
      subtotal: "210.00",
      vatTotal: "42.00",
      grandTotal: "252.00",
      amountPaid: "0.00",
      amountDue: "252.00",
      notes: "Event supply — April charity gala",
      items: [
        { description: "Ribena 500ml × 60", quantity: 60, unitPrice: 1.50, vatRate: 20, lineTotal: 90.00 },
        { description: "Lucozade 500ml × 60", quantity: 60, unitPrice: 1.80, vatRate: 20, lineTotal: 108.00 },
        { description: "Haribo Starmix × 36", quantity: 36, unitPrice: 1.50, vatRate: 0, lineTotal: 54.00 },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-003",
      customerName: "Northern Quarter Deli",
      customerEmail: "owner@nqdeli.co.uk",
      status: "overdue" as const,
      invoiceDate: "2026-03-15",
      dueDate: "2026-04-15",
      subtotal: "95.00",
      vatTotal: "0.00",
      grandTotal: "95.00",
      amountPaid: "0.00",
      amountDue: "95.00",
      items: [
        { description: "Semi-Skimmed Milk 2L × 24", quantity: 24, unitPrice: 1.75, vatRate: 0, lineTotal: 42.00 },
        { description: "Warburtons Bread × 24", quantity: 24, unitPrice: 1.50, vatRate: 0, lineTotal: 36.00 },
        { description: "Richmond Sausages × 10", quantity: 10, unitPrice: 2.50, vatRate: 0, lineTotal: 25.00 },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-004",
      customerName: "Didsbury Community Centre",
      status: "draft" as const,
      invoiceDate: "2026-05-03",
      dueDate: "2026-06-03",
      subtotal: "75.00",
      vatTotal: "0.00",
      grandTotal: "75.00",
      amountPaid: "0.00",
      amountDue: "75.00",
      items: [
        { description: "Haribo Starmix × 36", quantity: 36, unitPrice: 1.50, vatRate: 0, lineTotal: 54.00 },
        { description: "Kit Kat × 24", quantity: 24, unitPrice: 1.00, vatRate: 0, lineTotal: 24.00 },
      ],
      payments: [],
    },
  ]);

  console.log("✅ Invoices seeded");

  // ─── Alerts ───────────────────────────────────────────────────────────────
  await db.insert(alertsTable).values([
    {
      title: "Low Stock: Lucozade Original 500ml",
      message: "Stock level (45 units) is below reorder point (50 units). Consider raising a purchase order.",
      priority: "high" as const,
      category: "inventory" as const,
      isRead: false,
      relatedEntityType: "product",
      relatedEntityId: products.find((p) => p.sku === "LZ-500")?.id,
    },
    {
      title: "Low Stock: Semi-Skimmed Milk 2L",
      message: "Stock level (30 units) is below reorder point (40 units). PO-2026-003 is in draft — please approve.",
      priority: "high" as const,
      category: "inventory" as const,
      isRead: false,
      relatedEntityType: "product",
      relatedEntityId: products.find((p) => p.sku === "ML-2L")?.id,
    },
    {
      title: "Low Stock: Warburtons White Bread 800g",
      message: "Stock level (22 units) is below reorder point (30 units). Perishable item — order urgently.",
      priority: "critical" as const,
      category: "inventory" as const,
      isRead: false,
      relatedEntityType: "product",
      relatedEntityId: products.find((p) => p.sku === "WB-800")?.id,
    },
    {
      title: "Supplier Invoice Requires Review",
      message: "Invoice BST-2026-8834 from Bestway has an overall confidence score of 62%. Kit Kat line item flagged — unit price differs from PO.",
      priority: "medium" as const,
      category: "finance" as const,
      isRead: false,
      relatedEntityType: "supplier_invoice",
    },
    {
      title: "Invoice Overdue: INV-2026-003",
      message: "Invoice INV-2026-003 for Northern Quarter Deli (£95.00) is 18 days overdue. Payment was due 15 Apr 2026.",
      priority: "high" as const,
      category: "finance" as const,
      isRead: false,
      relatedEntityType: "invoice",
    },
    {
      title: "Audit Variance Detected",
      message: "Weekly audit (26 Apr) found variance of £12.50. Shrinkage rate: 1.20%. Review discrepancy categories.",
      priority: "medium" as const,
      category: "audit" as const,
      isRead: false,
      relatedEntityType: "audit",
      relatedEntityId: completedAudit.id,
    },
    {
      title: "System Backup Completed",
      message: "Nightly database backup completed successfully at 02:00 AM.",
      priority: "low" as const,
      category: "system" as const,
      isRead: true,
    },
    {
      title: "Purchase Order Received",
      message: "PO-2026-001 from Booker Wholesale has been received and inventory updated.",
      priority: "low" as const,
      category: "purchasing" as const,
      isRead: true,
      relatedEntityType: "purchase_order",
      relatedEntityId: po1.id,
    },
  ]);

  console.log("✅ Alerts seeded");
  console.log("\n🎉 Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
