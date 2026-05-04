import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import {
  useGetDashboard,
  useGetTopProducts,
  useGetAlerts,
  useMarkAlertRead,
  type Alert,
} from "@workspace/api-client-react";
import {
  formatGBP,
  formatDate,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  timeAgo,
} from "../lib/utils";

function MetricCard({
  label,
  value,
  change,
  warn,
}: {
  label: string;
  value: string;
  change?: number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p
        className={`mt-3 text-4xl font-bold tracking-tight ${
          warn ? "text-amber-500" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {change !== undefined && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-sm ${
            change >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span className="font-semibold">{Math.abs(change).toFixed(1)}%</span>
          <span className="text-gray-400">vs last 7d</span>
        </p>
      )}
    </div>
  );
}

function AlertPriorityDot({ priority }: { priority: Alert["priority"] }) {
  const colors = {
    critical: "bg-red-500",
    high: "bg-red-400",
    medium: "bg-amber-400",
    low: "bg-gray-300",
  };
  return (
    <span
      className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${colors[priority]}`}
    />
  );
}

export default function Dashboard() {
  const { data: stats, isPending } = useGetDashboard();
  const { data: topProducts } = useGetTopProducts({ days: 7, limit: 5 });
  const { data: unreadAlerts } = useGetAlerts({ unreadOnly: true });
  const markRead = useMarkAlertRead();

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Loading dashboard…
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Today's Revenue"
          value={formatGBP(stats.todayRevenue)}
          change={stats.revenueChange7d}
        />
        <MetricCard
          label="Orders Today"
          value={stats.todayOrders.toString()}
        />
        <MetricCard
          label="Low Stock Items"
          value={stats.lowStockCount.toString()}
          warn={stats.lowStockCount > 0}
        />
        <MetricCard
          label="Unread Alerts"
          value={stats.unreadAlertCount.toString()}
          warn={stats.unreadAlertCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Line Chart */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Revenue — Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })
                }
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `£${v}`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                formatter={(v: number) => formatGBP(v)}
                labelFormatter={(d) => formatDate(d)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{value}</span>
                )}
              />
              {Object.entries(PLATFORM_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={PLATFORM_LABELS[key]}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Breakdown — single bar per platform, brand colour */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Platform Breakdown (7d)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={stats.platformBreakdown}
              layout="vertical"
              margin={{ left: 0, right: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `£${v}`}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="platform"
                tickFormatter={(v) => PLATFORM_LABELS[v] ?? v}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={68}
              />
              <Tooltip
                formatter={(v: number) => [formatGBP(v), "Net Revenue"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
              />
              <Bar dataKey="netRevenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {stats.platformBreakdown.map((entry) => (
                  <Cell
                    key={entry.platform}
                    fill={PLATFORM_COLORS[entry.platform] ?? "#6b7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Top Products — Last 7 Days
          </h2>
          {topProducts && topProducts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 text-right font-medium">Units</th>
                  <th className="pb-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((p, i) => (
                  <tr key={p.productId}>
                    <td className="py-3 text-gray-700">
                      <span className="mr-2 text-xs font-medium text-gray-300">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      Product #{p.productId}
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {p.totalQuantity}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {formatGBP(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400">No sales data yet.</p>
          )}
        </div>

        {/* Alerts Feed */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Recent Alerts
          </h2>
          {unreadAlerts && unreadAlerts.length > 0 ? (
            <ul className="space-y-3">
              {unreadAlerts.slice(0, 5).map((alert) => (
                <li
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3"
                >
                  <AlertPriorityDot priority={alert.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                      {alert.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {timeAgo(alert.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => markRead.mutate(alert.id)}
                    className="shrink-0 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="mb-2 h-6 w-6 text-gray-200" />
              <p className="text-sm text-gray-400">No unread alerts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
