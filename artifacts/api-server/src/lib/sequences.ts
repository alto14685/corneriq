import { db, invoicesTable, purchaseOrdersTable, like, desc } from "@workspace/db";

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const rows = await db
    .select({ num: invoicesTable.invoiceNumber })
    .from(invoicesTable)
    .where(like(invoicesTable.invoiceNumber, `${prefix}%`))
    .orderBy(desc(invoicesTable.invoiceNumber))
    .limit(1);

  const last = rows[0]?.num;
  const next = last ? parseInt(last.split("-")[2]) + 1 : 1;
  return `${prefix}${next.toString().padStart(3, "0")}`;
}

export async function nextPONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const rows = await db
    .select({ num: purchaseOrdersTable.poNumber })
    .from(purchaseOrdersTable)
    .where(like(purchaseOrdersTable.poNumber, `${prefix}%`))
    .orderBy(desc(purchaseOrdersTable.poNumber))
    .limit(1);

  const last = rows[0]?.num;
  const next = last ? parseInt(last.split("-")[2]) + 1 : 1;
  return `${prefix}${next.toString().padStart(3, "0")}`;
}
