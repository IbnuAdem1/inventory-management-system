import { useQuery } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api";
import type { ActivityLog, ActivityType } from "@/types";

type ApiActivityType =
  | "SALE"
  | "STOCK"
  | "AUTH"
  | "PRICE"
  | "CREDIT"
  | "USER"
  | "TRANSFER"
  | "BRANCH"
  | "EXPENSE"
  | string;

interface ApiActivityLog {
  id: string;
  workerId?: string;
  workerName?: string;
  action?: string;
  detail?: string;
  type: ApiActivityType;
  createdAt: string;
}

const activityTypeMap: Record<string, ActivityType> = {
  SALE: "sale",
  STOCK: "stock",
  AUTH: "auth",
  PRICE: "price",
  CREDIT: "credit",
  USER: "user",
  TRANSFER: "transfer",
  BRANCH: "branch",
  EXPENSE: "expense",
  // Lowercase keys
  sale: "sale",
  stock: "stock",
  auth: "auth",
  price: "price",
  credit: "credit",
  user: "user",
  transfer: "transfer",
  branch: "branch",
  expense: "expense",
};

function formatTime(value?: string | null): string {
  if (!value) return "--:--";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "--:--";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "--:--";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

function mapActivityLog(log: ApiActivityLog): ActivityLog {
  const typeKey = (log.type || "").toUpperCase();
  const mappedType: ActivityType =
    activityTypeMap[typeKey] ||
    activityTypeMap[log.type] ||
    (typeof log.type === "string" ? (log.type.toLowerCase() as ActivityType) : "stock");

  return {
    id: log.id,
    time: formatTime(log.createdAt),
    dateFormatted: formatDate(log.createdAt),
    createdAt: log.createdAt,
    worker: log.workerName || "Staff",
    action: log.action || "",
    detail: log.detail || "",
    type: mappedType,
  };
}

export function useActivityQuery(date?: string) {
  return useQuery({
    queryKey: ["activity", date],
    enabled: Boolean(getAuthToken()),
    queryFn: async () => {
      const query = date ? `?date=${encodeURIComponent(date)}` : "";
      const logs = await apiFetch<ApiActivityLog[]>(`/activity${query}`);
      return Array.isArray(logs) ? logs.map(mapActivityLog) : [];
    },
  });
}
