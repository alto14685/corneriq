import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Link } from "wouter";
import { useGetAlerts } from "@workspace/api-client-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/sales": "Sales",
  "/purchase-orders": "Purchase Orders",
  "/supplier-invoices": "Supplier Invoices",
  "/audits": "Audits",
  "/invoices": "Invoices",
  "/alerts": "Alerts",
};

export default function Header() {
  const [location] = useLocation();
  const { data: alerts } = useGetAlerts({ unreadOnly: true });
  const unreadCount = alerts?.length ?? 0;

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === "/" ? location === "/" : location.startsWith(path),
    )?.[1] ?? "CornerIQ";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <Link href="/alerts">
        <a className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
          <span className="relative inline-flex">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        </a>
      </Link>
    </header>
  );
}
