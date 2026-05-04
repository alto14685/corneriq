import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
} from "lucide-react";
import {
  useGetAlerts,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  type AlertPriority,
  type AlertCategory,
} from "@workspace/api-client-react";
import { cn, timeAgo } from "../lib/utils";

const PRIORITY_ICONS: Record<AlertPriority, React.ElementType> = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: Info,
  low: Bell,
};

const PRIORITY_CLASSES: Record<AlertPriority, string> = {
  critical: "text-red-600",
  high: "text-red-400",
  medium: "text-amber-500",
  low: "text-gray-400",
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  inventory: "Inventory",
  finance: "Finance",
  audit: "Audit",
  purchasing: "Purchasing",
  system: "System",
};

export default function AlertsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | "all">("all");

  const { data: alerts, isPending } = useGetAlerts({ unreadOnly });
  const markRead = useMarkAlertRead();
  const markAll = useMarkAllAlertsRead();

  const filtered = alerts?.filter((a) => {
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    return true;
  });

  const unreadCount = alerts?.filter((a) => !a.isRead).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              unreadOnly
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50",
            )}
          >
            Unread only
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AlertCategory | "all")}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as AlertCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as AlertPriority | "all")}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            {(["critical", "high", "medium", "low"] as AlertPriority[]).map(
              (p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ),
            )}
          </select>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {isPending ? (
          <p className="py-12 text-center text-gray-400">Loading…</p>
        ) : !filtered?.length ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-400" />
            <p className="text-sm font-medium text-gray-600">All clear!</p>
            <p className="text-xs text-gray-400">
              No alerts match your current filter.
            </p>
          </div>
        ) : (
          filtered.map((alert) => {
            const Icon = PRIORITY_ICONS[alert.priority];
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border p-4 transition-colors",
                  alert.isRead
                    ? "border-gray-200 bg-white"
                    : "border-blue-100 bg-blue-50/40",
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    PRIORITY_CLASSES[alert.priority],
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          alert.isRead ? "text-gray-700" : "text-gray-900",
                        )}
                      >
                        {alert.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 capitalize">
                          {alert.priority}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {CATEGORY_LABELS[alert.category]}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>
                    </div>

                    {!alert.isRead && (
                      <button
                        onClick={() => markRead.mutate(alert.id)}
                        disabled={markRead.isPending}
                        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-60"
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">{alert.message}</p>

                  {alert.isRead && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
