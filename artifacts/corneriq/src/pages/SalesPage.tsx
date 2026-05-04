import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useGetSales,
  useGetSalesSummary,
  type Platform,
} from "@workspace/api-client-react";
import { formatGBP, formatDate, PLATFORM_COLORS, PLATFORM_LABELS, cn } from "../lib/utils";

const PLATFORMS: Array<{ value: Platform | "all"; label: string }> = [
  { value: "all", label: "All Platforms" },
  { value: "uber_eats", label: "Uber Eats" },
  { value: "deliveroo", label: "Deliveroo" },
  { value: "just_eat", label: "Just Eat" },
  { value: "in_store", label: "In Store" },
];

const STATUS_CLASSES: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-600",
};

function PlatformDot({ platform }: { platform: Platform }) {
  return (
    <span
      className="mr-1.5 inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: PLATFORM_COLORS[platform] }}
    />
  );
}

export default function SalesPage() {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [days, setDays] = useState(7);

  const { data: orders, isPending } = useGetSales({
    platform: platform !== "all" ? platform : undefined,
    days,
  });

  const { data: summary } = useGetSalesSummary({ days });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 p-1">
          {PLATFORMS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPlatform(value)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                platform === value
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {value !== "all" && <PlatformDot platform={value as Platform} />}
              {label}
            </button>
          ))}
        </div>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map((s) => (
            <div
              key={s.platform}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PLATFORM_COLORS[s.platform] }}
                />
                <p className="text-xs font-medium text-gray-500">
                  {PLATFORM_LABELS[s.platform]}
                </p>
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {formatGBP(s.grossRevenue)}
              </p>
              <p className="text-xs text-gray-500">
                Net: {formatGBP(s.netRevenue)} · {s.orderCount} orders
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {summary && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Revenue by Platform
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="platform"
                tickFormatter={(v) => PLATFORM_LABELS[v] ?? v}
                tick={{ fontSize: 11 }}
              />
              <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={(v: number) => formatGBP(v)} />
              <Legend />
              <Bar dataKey="grossRevenue" name="Gross Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netRevenue" name="Net Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="Commission" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3">Status</th>
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
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.slice(0, 50).map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <PlatformDot platform={o.platform} />
                      <span className="text-gray-700">
                        {PLATFORM_LABELS[o.platform]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {o.platformOrderId ?? `#${o.id}`}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {formatDate(o.orderedAt)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    {formatGBP(o.grossRevenue)}
                  </td>
                  <td className="px-4 py-2 text-right text-amber-600">
                    {formatGBP(o.commission)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-green-700">
                    {formatGBP(o.netRevenue)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_CLASSES[o.status] ?? "bg-gray-100 text-gray-600",
                      )}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {orders && orders.length > 50 && (
          <p className="px-4 py-3 text-center text-xs text-gray-400">
            Showing 50 of {orders.length} orders
          </p>
        )}
      </div>
    </div>
  );
}
