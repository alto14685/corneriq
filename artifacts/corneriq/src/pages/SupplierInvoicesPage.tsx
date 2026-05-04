import { useState } from "react";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import {
  useGetSupplierInvoices,
  useGetSuppliers,
  useApproveSupplierInvoice,
  type SupplierInvoice,
  type SupplierInvoiceItem,
} from "@workspace/api-client-react";
import { cn, formatGBP, formatDate } from "../lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  synced_to_pos: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending_review: Clock,
  approved: CheckCircle,
  synced_to_pos: CheckCircle,
  rejected: AlertTriangle,
};

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-green-500" : score >= 75 ? "bg-amber-500" : "bg-red-500";
  const label =
    score >= 90 ? "High" : score >= 75 ? "Medium" : "Low";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          score >= 90
            ? "text-green-700"
            : score >= 75
              ? "text-amber-700"
              : "text-red-700",
        )}
      >
        {score.toFixed(0)}% · {label}
      </span>
    </div>
  );
}

function ReviewDrawer({
  invoice,
  supplierName,
  onClose,
}: {
  invoice: SupplierInvoice;
  supplierName: string;
  onClose: () => void;
}) {
  const approve = useApproveSupplierInvoice();

  const handleApprove = () => {
    approve.mutate(invoice.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {invoice.invoiceNumber ?? `Invoice #${invoice.id}`}
            </h2>
            <p className="text-xs text-gray-500">{supplierName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Invoice Date</p>
              <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Payment Terms</p>
              <p className="font-medium">{invoice.paymentTermsDays ?? 30} days</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Overall Confidence</p>
              {invoice.overallConfidenceScore && (
                <ConfidenceBadge score={parseFloat(invoice.overallConfidenceScore)} />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLASSES[invoice.status])}>
                {invoice.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 text-left">
              <tr className="text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="pb-2">SKU / Product</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">VAT</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items as SupplierInvoiceItem[]).map((item, i) => (
                <tr key={i} className={cn(item.confidenceScore < 75 ? "bg-red-50" : "")}>
                  <td className="py-2">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="font-mono text-xs text-gray-500">{item.sku}</p>
                  </td>
                  <td className="py-2 text-right">{item.invoicedQuantity}</td>
                  <td className="py-2 text-right">{formatGBP(item.invoicedUnitPrice)}</td>
                  <td className="py-2 text-right text-gray-500">{item.vatRate}%</td>
                  <td className="py-2 text-right font-medium">{formatGBP(item.lineTotal)}</td>
                  <td className="py-2 text-right">
                    <ConfidenceBadge score={item.confidenceScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-lg bg-gray-50 p-4 text-right space-y-1">
            <p className="text-xs text-gray-500">
              Subtotal: {formatGBP(invoice.subtotal)}
            </p>
            <p className="text-xs text-gray-500">
              VAT: {formatGBP(invoice.vatTotal)}
            </p>
            <p className="text-base font-bold text-gray-900">
              Total: {formatGBP(invoice.grandTotal)}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          {invoice.status === "pending_review" && (
            <button
              onClick={handleApprove}
              disabled={approve.isPending}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {approve.isPending
                ? "Approving…"
                : "Approve & Sync to Inventory"}
            </button>
          )}
          {invoice.status === "synced_to_pos" && (
            <p className="text-center text-sm text-green-600 font-medium">
              ✓ Synced to POS — inventory updated
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupplierInvoicesPage() {
  const { data: invoices, isPending } = useGetSupplierInvoices();
  const { data: suppliers } = useGetSuppliers();
  const [selected, setSelected] = useState<SupplierInvoice | null>(null);

  const supplierMap = Object.fromEntries(
    suppliers?.map((s) => [s.id, s.name]) ?? [],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isPending ? (
          <p className="col-span-full text-center text-gray-400">Loading…</p>
        ) : !invoices?.length ? (
          <p className="col-span-full text-center text-gray-400">
            No supplier invoices yet.
          </p>
        ) : (
          invoices.map((inv) => {
            const score = inv.overallConfidenceScore
              ? parseFloat(inv.overallConfidenceScore)
              : null;
            const StatusIcon = STATUS_ICONS[inv.status] ?? Clock;

            return (
              <button
                key={inv.id}
                onClick={() => setSelected(inv)}
                className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {inv.invoiceNumber ?? `Invoice #${inv.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {supplierMap[inv.supplierId ?? 0] ?? `Supplier #${inv.supplierId}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_CLASSES[inv.status],
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {inv.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">
                    {formatGBP(inv.grandTotal)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(inv.invoiceDate)}
                  </p>
                </div>

                {score !== null && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs text-gray-500">
                      Confidence Score
                    </p>
                    <ConfidenceBadge score={score} />
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  {(inv.items as SupplierInvoiceItem[]).length} line items
                </p>
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <ReviewDrawer
          invoice={selected}
          supplierName={
            supplierMap[selected.supplierId ?? 0] ??
            `Supplier #${selected.supplierId}`
          }
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
