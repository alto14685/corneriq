import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import {
  useGetPurchaseOrders,
  useGetSuppliers,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  type POStatus,
  type POItem,
} from "@workspace/api-client-react";
import { cn, formatGBP, formatDate } from "../lib/utils";

const STATUS_CLASSES: Record<POStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-purple-100 text-purple-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  partially_received: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS: POStatus[] = [
  "draft", "approved", "sent", "confirmed", "partially_received", "received", "cancelled",
];

function CreatePOSheet({ onClose }: { onClose: () => void }) {
  const { data: suppliers } = useGetSuppliers();
  const createPO = useCreatePurchaseOrder();
  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { productId: 0, sku: "", productName: "", quantity: 1, unitCost: 0, lineTotal: 0 },
  ]);

  const updateItem = (
    i: number,
    field: keyof POItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      if (field === "quantity" || field === "unitCost") {
        updated[i].lineTotal =
          Number(updated[i].quantity) * Number(updated[i].unitCost);
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPO.mutate(
      {
        supplierId: parseInt(supplierId),
        expectedDeliveryDate: deliveryDate || undefined,
        notes: notes || undefined,
        items,
      },
      { onSuccess: onClose },
    );
  };

  const totalValue = items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Create Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                required
              >
                <option value="">Select supplier…</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Expected Delivery
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Line Items */}
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
                      { productId: 0, sku: "", productName: "", quantity: 1, unitCost: 0, lineTotal: 0 },
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
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="SKU"
                        value={item.sku}
                        onChange={(e) => updateItem(i, "sku", e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <input
                        placeholder="Product name"
                        value={item.productName}
                        onChange={(e) => updateItem(i, "productName", e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value))}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Unit cost (£)"
                        value={item.unitCost}
                        onChange={(e) => updateItem(i, "unitCost", parseFloat(e.target.value))}
                        step="0.01"
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Line total: {formatGBP(item.lineTotal)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setItems((p) => p.filter((_, j) => j !== i))
                          }
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-right">
              <span className="text-sm font-semibold text-gray-900">
                Total: {formatGBP(totalValue)}
              </span>
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
              disabled={createPO.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createPO.isPending ? "Creating…" : "Create PO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<POStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const { data: orders, isPending } = useGetPurchaseOrders(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );
  const updateStatus = useUpdatePurchaseOrderStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50",
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create PO
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">PO Number</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3">Expected Delivery</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isPending ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : !orders?.length ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">
                    {po.poNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-700">#{po.supplierId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_CLASSES[po.status],
                      )}
                    >
                      {po.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatGBP(po.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(po.expectedDeliveryDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(po.createdAt)}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() =>
                        setOpenStatusMenu(
                          openStatusMenu === po.id ? null : po.id,
                        )
                      }
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Update <ChevronDown className="h-3 w-3" />
                    </button>
                    {openStatusMenu === po.id && (
                      <div className="absolute right-4 top-10 z-10 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              updateStatus.mutate({ id: po.id, status: s });
                              setOpenStatusMenu(null);
                            }}
                            className="w-full px-4 py-1.5 text-left text-xs capitalize text-gray-700 hover:bg-gray-50"
                          >
                            {s.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreatePOSheet onClose={() => setShowCreate(false)} />}
    </div>
  );
}
