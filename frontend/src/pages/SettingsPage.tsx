import DashboardLayout from "@/components/DashboardLayout";
import { Shield, Users, Bell } from "lucide-react";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">System configuration</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
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
          </div>

          <div className="rounded-lg border border-border bg-card p-6 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">User Management</h3>
                <p className="text-xs text-muted-foreground">Manage workers and permissions</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add or remove workers, assign roles, and configure access permissions.
            </p>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
