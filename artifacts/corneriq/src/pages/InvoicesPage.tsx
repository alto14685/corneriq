import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import {
  useGetInvoices,
  useCreateInvoice,
  useRecordPayment,
  type Invoice,
  type InvoiceStatus,
  type InvoiceLineItem,
} from "@workspace/api-client-react";
import { cn, formatGBP, formatDate } from "../lib/utils";

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-indigo-100 text-indigo-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  disputed: "bg-orange-100 text-orange-700",
  void: "bg-gray-100 text-gray-400 line-through",
};

function CreateInvoiceSheet({ onClose }: { onClose: () => void }) {
  const createInvoice = useCreateInvoice();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 0, lineTotal: 0 },
  ]);

  const updateItem = (
    i: number,
    field: keyof InvoiceLineItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      const qty = Number(updated[i].quantity);
      const price = Number(updated[i].unitPrice);
      updated[i].lineTotal = qty * price;
      return updated;
    });
  };

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const vatTotal = items.reduce(
    (s, i) => s + i.lineTotal * (i.vatRate / 100),
    0,
  );
  const grandTotal = subtotal + vatTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoice.mutate(
      { customerName, customerEmail, invoiceDate, dueDate, items },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Create Invoice
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Customer Name *
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Line Items
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setItems((p) => [
                      ...p,
                      { description: "", quantity: 1, unitPrice: 0, vatRate: 0, lineTotal: 0 },
                    ])
                  }
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  + Add Item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3">
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value))}
                        min="1"
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Unit £"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value))}
                        step="0.01"
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none"
                      />
                      <select
                        value={item.vatRate}
                        onChange={(e) => updateItem(i, "vatRate", parseFloat(e.target.value))}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value={0}>0% VAT</option>
                        <option value={5}>5% VAT</option>
                        <option value={20}>20% VAT</option>
                      </select>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs font-medium text-gray-700">
                          {formatGBP(item.lineTotal)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-right space-y-1">
              <p className="text-xs text-gray-500">
                Subtotal: {formatGBP(subtotal)}
              </p>
              <p className="text-xs text-gray-500">
                VAT: {formatGBP(vatTotal)}
              </p>
              <p className="text-base font-bold text-gray-900">
                Total: {formatGBP(grandTotal)}
              </p>
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInvoice.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createInvoice.isPending ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const record = useRecordPayment();
  const [amount, setAmount] = useState(invoice.amountDue);
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    record.mutate(
      { id: invoice.id, amount: parseFloat(amount), method, reference },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Record Payment
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          {invoice.invoiceNumber} · Due: {formatGBP(invoice.amountDue)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Amount (£)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Reference
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={record.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {record.isPending ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { data: invoices, isPending } = useGetInvoices();
  const [showCreate, setShowCreate] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {invoices?.length ?? 0} invoices
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Amount Due</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isPending ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : !invoices?.length ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{inv.customerName}</p>
                    {inv.customerEmail && (
                      <p className="text-xs text-gray-400">{inv.customerEmail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_CLASSES[inv.status],
                      )}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(inv.invoiceDate)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3",
                      inv.status === "overdue" ? "text-red-600 font-medium" : "text-gray-600",
                    )}
                  >
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatGBP(inv.grandTotal)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      parseFloat(inv.amountDue) > 0
                        ? "text-red-600"
                        : "text-green-600",
                    )}
                  >
                    {formatGBP(inv.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.status !== "paid" && inv.status !== "void" && (
                      <button
                        onClick={() => setPaymentInvoice(inv)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        <CreditCard className="h-3 w-3" />
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateInvoiceSheet onClose={() => setShowCreate(false)} />}
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
        />
      )}
    </div>
  );
}
