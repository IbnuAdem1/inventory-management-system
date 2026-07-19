import { Shield, ShoppingCart, Package, Edit, Loader2, CreditCard, UserCog } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useActivityQuery } from "@/hooks/useActivity";
import { useUsersQuery } from "@/hooks/useUsers";
import type { ActivityType } from "@/types";

const iconMap: Record<ActivityType, React.ElementType> = {
  sale: ShoppingCart,
  stock: Package,
  auth: Shield,
  price: Edit,
  credit: CreditCard,
  user: UserCog,
};

const colorMap: Record<ActivityType, string> = {
  sale: "text-primary",
  stock: "text-success",
  auth: "text-muted-foreground",
  price: "text-destructive",
  credit: "text-warning",
  user: "text-blue-400",
};

const ActivityPage = () => {
  const { data: logs, isLoading: logsLoading, isError: logsError } = useActivityQuery();
  const { data: users, isLoading: usersLoading, isError: usersError } = useUsersQuery();

  if (logsLoading || usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (logsError || usersError) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center text-destructive">
          Failed to load activity data. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const workers = users?.filter(u => u.role === "WORKER" || u.role === "OWNER") || [];
  const activityLogs = logs || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Activity</h1>
          <p className="text-sm text-muted-foreground">
            Non-editable activity logs — today
          </p>
        </div>

        {/* Worker status */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {workers.map((worker) => {
            const workerLogs = activityLogs.filter(
              (l) => l.worker === worker.name
            );
            const salesCount = workerLogs.filter(l => l.type === "sale").length;
            const isOnline = workerLogs.some(
              (l) => l.type === "auth" && l.action.toLowerCase().includes("login")
            );
            return (
              <div key={worker.id} className="rounded-lg border border-border bg-card p-4 card-hover">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium text-card-foreground">{worker.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{salesCount} sales today</p>
              </div>
            );
          })}
        </div>

        {/* Activity timeline */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-card-foreground">Activity Timeline</h3>
          </div>
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {activityLogs.length > 0 ? (
              activityLogs.map((log, i) => {
                const Icon = iconMap[log.type] || Package;
                return (
                  <div key={log.id || i} className="flex items-start gap-4 px-5 py-3">
                    <span className="mt-0.5 text-xs text-muted-foreground font-mono w-16 shrink-0">
                      {log.time}
                    </span>
                    <div className={`mt-0.5 ${colorMap[log.type] || "text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-card-foreground">
                        <span className="font-medium">{log.worker}</span>{" "}
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No activity recorded today.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityPage;
