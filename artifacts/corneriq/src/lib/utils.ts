import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGBP(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return isNaN(n)
    ? "£0.00"
    : n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export function formatDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "—";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const PLATFORM_COLORS: Record<string, string> = {
  uber_eats: "#06C167",
  deliveroo: "#00CCBC",
  just_eat: "#FF8000",
  in_store: "#3B82F6",
};

export const PLATFORM_LABELS: Record<string, string> = {
  uber_eats: "Uber Eats",
  deliveroo: "Deliveroo",
  just_eat: "Just Eat",
  in_store: "In Store",
};
