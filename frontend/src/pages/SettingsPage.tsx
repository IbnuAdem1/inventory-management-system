import { Shield, Users, Bell, Loader2, Plus, UserPlus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUsersQuery } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SettingsPage = () => {
  const { data: users, isLoading, isError } = useUsersQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">System configuration & management</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Management Section */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">User Management</h3>
                  <p className="text-xs text-muted-foreground">Manage workers and permissions</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isError ? (
                <p className="text-sm text-destructive text-center py-8">Failed to load users.</p>
              ) : (
                <div className="divide-y divide-border/50 border rounded-md overflow-hidden">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-3 bg-card/50">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "OWNER" ? "default" : "secondary"} className="text-[10px]">
                          {user.role}
                        </Badge>
                        <Badge variant={user.isActive ? "outline" : "destructive"} className="text-[10px] text-success border-success/30">
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground">
              Add or remove workers, assign roles, and configure access permissions.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">Security</h3>
                  <p className="text-xs text-muted-foreground">Password & authentication settings</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure password policies, two-factor authentication, and session management.
              </p>
              <Button className="mt-4 w-full" variant="outline" size="sm">
                Update Security Settings
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">Alert preferences</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure low-stock alerts, daily summary reports, and suspicious activity notifications.
              </p>
              <Button className="mt-4 w-full" variant="outline" size="sm">
                Manage Alerts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
