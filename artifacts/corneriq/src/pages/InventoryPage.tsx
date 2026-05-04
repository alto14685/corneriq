import { useState } from "react";
import { Search, SlidersHorizontal, TrendingDown } from "lucide-react";
import {
  useGetInventory,
  useAdjustStock,
  type InventoryWithProduct,
  type StockStatus,
} from "@workspace/api-client-react";
import { cn, formatGBP, formatDate } from "../lib/utils";

const STATUS_LABELS: Record<StockStatus, string> = {
  ok: "In Stock",
  medium: "Adequate",
  low: "Low Stock",
  out_of_stock: "Out of Stock",
};

const STATUS_CLASSES: Record<StockStatus, string> = {
  ok: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-amber-100 text-amber-800",
  out_of_stock: "bg-red-100 text-red-800",
};

function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function AdjustStockModal({
  item,
  onClose,
}: {
  item: InventoryWithProduct;
  onClose: () => void;
}) {
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const adjust = useAdjustStock();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjust.mutate(
      {
        productId: item.productId,
        adjustment: parseFloat(adjustment),
        reason,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Adjust Stock
        </h2>
        <p className="mb-4 text-sm text-gray-500">{item.product.name}</p>
        <p className="mb-4 text-sm text-gray-700">
          Current:{" "}
          <strong>{parseFloat(item.quantityOnHand)}</strong> units
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Adjustment (+ or -)
            </label>
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="e.g. -5 or +12"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damage, manual correction"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjust.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {adjust.isPending ? "Saving…" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [filter, setFilter] = useState<StockStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [adjustItem, setAdjustItem] = useState<InventoryWithProduct | null>(null);

  const { data: inventory, isPending } = useGetInventory(
    filter !== "all" ? { stockStatus: filter } : undefined,
  );

  const filtered = inventory?.filter((row) =>
    search
      ? row.product.name.toLowerCase().includes(search.toLowerCase()) ||
        row.product.sku.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-300 p-1">
          <SlidersHorizontal className="ml-2 h-3.5 w-3.5 text-gray-400" />
          {(["all", "ok", "medium", "low", "out_of_stock"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  filter === s
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                {s === "all"
                  ? "All"
                  : s === "out_of_stock"
                    ? "Out of Stock"
                    : STATUS_LABELS[s]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">On Hand</th>
              <th className="px-4 py-3 text-right">Reorder Pt.</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Counted</th>
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
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No products match your filter.
                </td>
              </tr>
            ) : (
              filtered?.map((row) => {
                const qty = parseFloat(row.quantityOnHand);
                const belowReorder = qty <= row.product.reorderPoint;
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {belowReorder && (
                          <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        {row.product.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {row.product.sku}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {row.product.category}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {qty}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {row.product.reorderPoint}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge status={row.stockStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(row.lastCountedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setAdjustItem(row)}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
        />
      )}
    </div>
  );
}
