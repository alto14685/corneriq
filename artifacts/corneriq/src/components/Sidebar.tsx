import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  FileText,
  ClipboardCheck,
  Receipt,
  Bell,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useGetAlerts } from "@workspace/api-client-react";

const nav = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/sales", label: "Sales", icon: ShoppingCart },
  { path: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { path: "/supplier-invoices", label: "Supplier Invoices", icon: FileText },
  { path: "/audits", label: "Audits", icon: ClipboardCheck },
  { path: "/invoices", label: "Invoices", icon: Receipt },
  { path: "/alerts", label: "Alerts", icon: Bell },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { data: alerts } = useGetAlerts({ unreadOnly: true });
  const unreadCount = alerts?.length ?? 0;

  return (
    <aside className="flex w-64 flex-col bg-slate-900">
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/60 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">
          CQ
        </div>
        <span className="text-lg font-semibold text-white">CornerIQ</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map(({ path, label, icon: Icon }) => {
          const active =
            path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border-l-2",
                  active
                    ? "border-blue-400 bg-slate-800 text-white"
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {label === "Alerts" && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/60 p-4">
        <p className="text-xs font-medium text-slate-400">CornerIQ Demo Store</p>
        <p className="text-xs text-slate-500">Manchester, UK</p>
      </div>
    </aside>
  );
}
