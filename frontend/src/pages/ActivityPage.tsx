// src/pages/ActivityPage.tsx
import { useState, useMemo } from "react";
import {
  Shield,
  ShoppingCart,
  Package,
  Edit,
  Loader2,
  CreditCard,
  UserCog,
  Calendar as CalendarIcon,
  Search,
  Clock,
  ArrowRightLeft,
  Building2,
  Receipt,
  User,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useActivityQuery } from "@/hooks/useActivity";
import { useUsersQuery } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ExportButton from "@/components/ui/ExportButton";
import type { ActivityType } from "@/types";

const iconMap: Record<ActivityType, React.ElementType> = {
  sale: ShoppingCart,
  stock: Package,
  auth: Shield,
  price: Edit,
  credit: CreditCard,
  user: UserCog,
  transfer: ArrowRightLeft,
  branch: Building2,
  expense: Receipt,
};

const badgeColorMap: Record<ActivityType, string> = {
  sale: "bg-primary/10 text-primary border-primary/20",
  stock: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  auth: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  price: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  credit: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  user: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  transfer: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  branch: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  expense: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

type DatePreset = "today" | "yesterday" | "last7days" | "custom" | "all";

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ActivityPage = () => {
  const { user: currentUser } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customDate, setCustomDate] = useState<string>(getLocalDateString());
  const [selectedWorker, setSelectedWorker] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Calculate query date parameter based on preset
  const queryDate = useMemo(() => {
    if (datePreset === "today") {
      return getLocalDateString();
    }
    if (datePreset === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return getLocalDateString(yesterday);
    }
    if (datePreset === "custom") {
      return customDate;
    }
    return undefined; // "all" and "last7days" fetch and filter in memory for smooth grouping
  }, [datePreset, customDate]);

  const { data: rawLogs = [], isLoading: logsLoading, isError: logsError } = useActivityQuery(queryDate);
  const { data: users = [], isLoading: usersLoading } = useUsersQuery();

  // Combine known users with workers found in logs so staff filters/cards never break
  const workers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();

    if (Array.isArray(users)) {
      users.forEach((u) => {
        if (u?.name) {
          map.set(u.name.toLowerCase(), {
            id: u.id,
            name: u.name,
            role: u.role === "OWNER" ? "Owner" : "Staff",
          });
        }
      });
    }

    if (currentUser?.name && !map.has(currentUser.name.toLowerCase())) {
      map.set(currentUser.name.toLowerCase(), {
        id: currentUser.id || "current-user",
        name: currentUser.name,
        role: currentUser.role === "owner" ? "Owner" : "Staff",
      });
    }

    if (Array.isArray(rawLogs)) {
      rawLogs.forEach((l) => {
        if (l?.worker && !map.has(l.worker.toLowerCase())) {
          map.set(l.worker.toLowerCase(), {
            id: l.worker,
            name: l.worker,
            role: "Staff",
          });
        }
      });
    }

    return Array.from(map.values());
  }, [users, currentUser, rawLogs]);

  // Filter logs by date preset (for last7days / all), staff member, category, and text search
  const filteredLogs = useMemo(() => {
    let list = Array.isArray(rawLogs) ? rawLogs : [];

    // Filter by Last 7 Days if selected
    if (datePreset === "last7days") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
      list = list.filter((log) => {
        if (!log.createdAt) return true;
        const d = new Date(log.createdAt);
        return !isNaN(d.getTime()) && d >= cutoff;
      });
    }

    // Filter by Worker
    if (selectedWorker !== "all") {
      list = list.filter(
        (log) => (log.worker || "").toLowerCase() === selectedWorker.toLowerCase()
      );
    }

    // Filter by Activity Type
    if (selectedType !== "all") {
      list = list.filter((log) => log.type === selectedType);
    }

    // Filter by Search Text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (log) =>
          (log.worker || "").toLowerCase().includes(q) ||
          (log.action || "").toLowerCase().includes(q) ||
          (log.detail || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [rawLogs, datePreset, selectedWorker, selectedType, searchQuery]);

  // Group filtered logs by day for chronological timeline display
  const groupedLogs = useMemo(() => {
    const groups: { [dateStr: string]: typeof filteredLogs } = {};
    const todayStr = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    for (const log of filteredLogs) {
      let logDateStr = "Recent";
      if (log.createdAt) {
        const d = new Date(log.createdAt);
        if (!isNaN(d.getTime())) {
          logDateStr = getLocalDateString(d);
        }
      }

      let headerTitle = log.dateFormatted || logDateStr;
      if (logDateStr === todayStr) {
        headerTitle = `Today — ${log.dateFormatted || logDateStr}`;
      } else if (logDateStr === yesterdayStr) {
        headerTitle = `Yesterday — ${log.dateFormatted || logDateStr}`;
      }

      if (!groups[headerTitle]) {
        groups[headerTitle] = [];
      }
      groups[headerTitle].push(log);
    }

    return groups;
  }, [filteredLogs]);

  // Export prepared data
  const exportData = useMemo(() => {
    return filteredLogs.map((log) => ({
      "Date": log.dateFormatted || (log.createdAt ? getLocalDateString(new Date(log.createdAt)) : ""),
      "Time": log.time || "",
      "Staff Member": log.worker || "Staff",
      "Activity Type": (log.type || "ACTIVITY").toUpperCase(),
      "Action": log.action || "",
      "Details": log.detail || "",
    }));
  }, [filteredLogs]);

  if (logsLoading && rawLogs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (logsError) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load activity logs. Please refresh or try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getDateLabel = () => {
    switch (datePreset) {
      case "today": return "today";
      case "yesterday": return "yesterday";
      case "last7days": return "in the last 7 days";
      case "custom": return `on ${customDate}`;
      case "all": return "all time";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Employee Activity Log</h1>
              <Badge variant="outline" className="text-xs bg-muted/50">
                {filteredLogs.length} Event{filteredLogs.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Immutable audit trail of sales, inventory updates, and logins across all staff members
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButton filename={`staff-activity-${datePreset}`} data={exportData} />
          </div>
        </div>

        {/* Date Filter & Preset Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            Date Period:
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "today" as const, label: "Today" },
              { key: "yesterday" as const, label: "Yesterday" },
              { key: "last7days" as const, label: "Last 7 Days" },
              { key: "all" as const, label: "All History" },
              { key: "custom" as const, label: "Pick Date" },
            ].map((preset) => {
              const active = datePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => setDatePreset(preset.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {datePreset === "custom" && (
            <div className="flex items-center gap-2 ml-2 animate-in fade-in">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-8 text-xs w-36 bg-background"
              />
            </div>
          )}
        </div>

        {/* Worker Performance & Live Status Cards (Strictly Scoped to Selected Date) */}
        {workers.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {workers.map((worker) => {
              const workerLogs = filteredLogs.filter(
                (l) => (l.worker || "").toLowerCase() === worker.name.toLowerCase()
              );
              const salesCount = workerLogs.filter((l) => l.type === "sale").length;
              const inventoryCount = workerLogs.filter((l) => l.type === "stock" || l.type === "transfer").length;

              // Check if worker had actions in this period
              const hasRecentActivity = workerLogs.length > 0;

              return (
                <div
                  key={worker.id}
                  onClick={() => setSelectedWorker(selectedWorker === worker.name ? "all" : worker.name)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedWorker === worker.name
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          hasRecentActivity ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-muted-foreground/40"
                        }`}
                        title={hasRecentActivity ? "Active in selected period" : "No activity in selected period"}
                      />
                      <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                        {worker.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono py-0 px-1">
                      {worker.role}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Sales:</span>
                      <span className={`font-mono font-bold ${salesCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {salesCount} sale{salesCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Stock Edits:</span>
                      <span className="font-mono text-muted-foreground">
                        {inventoryCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-muted-foreground/80 italic text-right">
                    {getDateLabel()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-lg border border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search actions, parts, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Staff Member */}
            {workers.length > 0 && (
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff Members</SelectItem>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.name}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filter by Category */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <SelectValue placeholder="All Activity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="sale">🛒 POS Sales</SelectItem>
                <SelectItem value="stock">📦 Stock Updates</SelectItem>
                <SelectItem value="transfer">🔄 Stock Transfers</SelectItem>
                <SelectItem value="expense">🧾 Expenses</SelectItem>
                <SelectItem value="credit">💳 Credit Records</SelectItem>
                <SelectItem value="auth">🛡️ Logins & Sessions</SelectItem>
                <SelectItem value="price">💲 Price Changes</SelectItem>
                <SelectItem value="user">👥 User Changes</SelectItem>
                <SelectItem value="branch">🏢 Branch Changes</SelectItem>
              </SelectContent>
            </Select>

            {(selectedWorker !== "all" || selectedType !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedWorker("all");
                  setSelectedType("all");
                  setSearchQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-9"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Activity Timeline Grouped by Day */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {Object.keys(groupedLogs).length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold text-foreground">No Activity Found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No staff actions recorded for {getDateLabel()}. Try changing the date filter or searching for another term.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {Object.entries(groupedLogs).map(([groupDate, logs]) => (
                <div key={groupDate} className="space-y-0">
                  {/* Date Section Header */}
                  <div className="bg-muted/40 px-5 py-2.5 flex items-center justify-between border-y border-border/60">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-foreground tracking-wide">
                        {groupDate}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {logs.length} action{logs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Actions under this day */}
                  <div className="divide-y divide-border/40">
                    {logs.map((log, index) => {
                      const Icon = (log.type && iconMap[log.type]) || Package;
                      const badgeClass = (log.type && badgeColorMap[log.type]) || "bg-muted text-muted-foreground border-border";

                      return (
                        <div
                          key={log.id || `${groupDate}-${index}`}
                          className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                        >
                          {/* Time Stamp */}
                          <div className="mt-0.5 text-xs text-muted-foreground font-mono w-20 shrink-0 text-left">
                            {log.time}
                          </div>

                          {/* Activity Icon Badge */}
                          <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 ${badgeClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>

                          {/* Action Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {log.worker}
                              </span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {log.action}
                              </span>
                              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 capitalize font-medium ${badgeClass}`}>
                                {log.type}
                              </Badge>
                            </div>

                            {log.detail && (
                              <p className="text-xs text-muted-foreground mt-0.5 break-words font-mono bg-muted/30 px-2 py-1 rounded inline-block">
                                {log.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityPage;
