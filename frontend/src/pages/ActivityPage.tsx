import { Shield, ShoppingCart, Package, Edit } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { mockActivityLogs, mockWorkers } from "@/data/mockData";
import type { ActivityType } from "@/types";

const iconMap: Record<ActivityType, React.ElementType> = {
  sale: ShoppingCart,
  stock: Package,
  auth: Shield,
  price: Edit,
};

const colorMap: Record<ActivityType, string> = {
  sale: "text-primary",
  stock: "text-success",
  auth: "text-muted-foreground",
  price: "text-destructive",
};

const ActivityPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Activity</h1>
          <p className="text-sm text-muted-foreground">
            Non-editable activity logs — today
          </p>
        </div>

        {/* Worker status — derived from shared mockWorkers list */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {mockWorkers.map((worker) => {
            const salesCount = mockActivityLogs.filter(
              (l) => l.worker === worker.name && l.type === "sale"
            ).length;
            const isOnline = mockActivityLogs.some(
              (l) => l.worker === worker.name && l.type === "auth"
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
          <div className="divide-y divide-border/50">
            {mockActivityLogs.map((log, i) => {
              const Icon = iconMap[log.type];
              return (
                <div key={i} className="flex items-start gap-4 px-5 py-3">
                  <span className="mt-0.5 text-xs text-muted-foreground font-mono w-16 shrink-0">
                    {log.time}
                  </span>
                  <div className={`mt-0.5 ${colorMap[log.type]}`}>
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
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityPage;
