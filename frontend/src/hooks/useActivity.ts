import { useQuery } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api";
import type { ActivityLog, ActivityType } from "@/types";

type ApiActivityType = "SALE" | "STOCK" | "AUTH" | "PRICE";

interface ApiActivityLog {
  id: string;
  workerId: string;
  workerName: string;
  action: string;
  detail: string;
  type: ApiActivityType;
  createdAt: string;
}

const activityTypeMap: Record<ApiActivityType, ActivityType> = {
  SALE: "sale",
  STOCK: "stock",
  AUTH: "auth",
  PRICE: "price",
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function mapActivityLog(log: ApiActivityLog): ActivityLog {
  return {
    id: log.id,
    time: formatTime(log.createdAt),
    worker: log.workerName,
    action: log.action,
    detail: log.detail,
    type: activityTypeMap[log.type],
  };
}

export function useActivityQuery(date?: string) {
  return useQuery({
    queryKey: ["activity", date],
    enabled: Boolean(getAuthToken()),
    queryFn: async () => {
      const query = date ? `?date=${encodeURIComponent(date)}` : "";
      const logs = await apiFetch<ApiActivityLog[]>(`/activity${query}`);
      return logs.map(mapActivityLog);
    },
  });
}
