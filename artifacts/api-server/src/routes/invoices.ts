import { Router } from "express";
import { eq } from "@workspace/db";
import { db, invoicesTable } from "@workspace/db";
import { nextInvoiceNumber } from "../lib/sequences";

export const invoicesRouter = Router();

invoicesRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(invoicesTable);
  res.json({ data: rows });
});

invoicesRouter.post("/", async (req, res) => {
  const {
    customerName,
    customerEmail,
    invoiceDate,
    dueDate,
    notes,
    items,
  } = req.body as {
    customerName: string;
    customerEmail?: string;
    invoiceDate: string;
    dueDate: string;
    notes?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      lineTotal: number;
    }>;
  };

  const invoiceNumber = await nextInvoiceNumber();

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const vatTotal = items.reduce(
    (sum, i) => sum + i.lineTotal * (i.vatRate / 100),
    0,
  );
  const grandTotal = subtotal + vatTotal;

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      invoiceNumber,
      customerName,
      customerEmail,
      invoiceDate,
      dueDate,
      notes,
      subtotal: subtotal.toFixed(2),
      vatTotal: vatTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      amountPaid: "0",
      amountDue: grandTotal.toFixed(2),
      items,
      payments: [],
      status: "draft",
    })
    .returning();

  res.status(201).json({ data: invoice });
});

invoicesRouter.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(invoicesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(invoicesTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Invoice not found" });
  res.json({ data: updated });
});

invoicesRouter.post("/:id/payment", async (req, res) => {
  const id = parseInt(req.params.id);
  const { amount, method, reference } = req.body as {
    amount: number;
    method: string;
    reference?: string;
  };

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id));

  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const payments = [
    ...(invoice.payments as any[]),
    {
      amount,
      method,
      reference: reference ?? "",
      paidAt: new Date().toISOString().split("T")[0],
    },
  ];

  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const grandTotal = parseFloat(invoice.grandTotal);
  const amountDue = Math.max(0, grandTotal - totalPaid);
  const status =
    amountDue <= 0
      ? "paid"
      : totalPaid > 0
        ? "partially_paid"
        : invoice.status;

  const [updated] = await db
    .update(invoicesTable)
    .set({
      payments,
      amountPaid: totalPaid.toFixed(2),
      amountDue: amountDue.toFixed(2),
      status: status as any,
      updatedAt: new Date(),
    })
    .where(eq(invoicesTable.id, id))
    .returning();

  res.json({ data: updated });
});
