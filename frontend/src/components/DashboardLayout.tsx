// src/components/DashboardLayout.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  Contact2,
  ChevronDown,
  UserRound,
  Building2,
  Landmark,
  CreditCard,
  Receipt,
  KeyRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChangePasswordModal from "@/components/ui/ChangePasswordModal";
import BranchSelector from "@/components/BranchSelector";
import AiInvoiceParserDialog from "@/components/ai/AiInvoiceParserDialog";



type NavChildItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  children?: NavChildItem[];
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package,          label: "Inventory",  path: "/inventory" },
  { icon: ShoppingCart,     label: "Sales",      path: "/sales" },
  { icon: CreditCard,       label: "Credits",    path: "/credits" },
  {
    icon: Contact2,
    label: "Contacts",
    path: "/contacts",
    children: [
      { icon: UserRound, label: "Customer Contacts", path: "/contacts?section=customer" },
      { icon: Building2, label: "Supplier Contacts", path: "/contacts?section=supplier" },
      { icon: Landmark, label: "Bank Accounts", path: "/contacts?section=bank-accounts" },
    ],
  },
  { icon: BarChart3,        label: "Reports",    path: "/reports" },
  { icon: Users,            label: "Activity",   path: "/activity" },
  { icon: Receipt,          label: "Expenses",   path: "/expenses" },
  { icon: Settings,         label: "Settings",   path: "/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };


  const avatarInitial = user?.name?.charAt(0).toUpperCase() ?? "O";

  const userPermissions = user?.permissions || ["sales", "inventory_view", "credits", "customers"];
  const isOwner = user?.role === "owner";

  const visibleNavItems = navItems.filter((item) => {
    if (isOwner) return true;
    if (item.path === "/dashboard") return true;
    if (item.path === "/settings") return false; // Settings is owner-only
    if (item.path === "/activity") return isOwner; // Activity is owner-only
    if (item.path === "/inventory") {
      return (
        userPermissions.includes("inventory_view") ||
        userPermissions.includes("inventory_manage") ||
        userPermissions.includes("inventory")
      );
    }
    if (item.path === "/sales") return userPermissions.includes("sales");
    if (item.path === "/credits") {
      return userPermissions.includes("credits") || userPermissions.includes("credits_all");
    }
    if (item.path === "/expenses") return userPermissions.includes("expenses");
    if (item.path === "/reports") return userPermissions.includes("reports");
    if (item.path === "/contacts") {
      return (
        userPermissions.includes("customers") ||
        userPermissions.includes("customers_all") ||
        userPermissions.includes("suppliers") ||
        userPermissions.includes("bank_accounts")
      );
    }
    return true;
  });

  useEffect(() => {
    if (location.pathname === "/contacts") {
      setContactsOpen(true);
    }
  }, [location.pathname, location.search]);


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              AutoParts Pro
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {user?.role === "owner" ? "Store Owner" : "Counter Staff"}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-sidebar-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav — Dynamic permissions filtering */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isContacts = item.path === "/contacts";
            const isActive = location.pathname === item.path;
            const activeSection = new URLSearchParams(location.search).get("section") ?? "customer";
            const contactsActive = isContacts && location.pathname === "/contacts";

            if (isContacts) {
              const visibleChildren = (item.children || []).filter((child) => {
                if (isOwner) return true;
                const childSec = new URLSearchParams(new URL(child.path, "http://localhost").search).get("section");
                if (childSec === "customer") {
                  return userPermissions.includes("customers") || userPermissions.includes("customers_all") || userPermissions.includes("sales");
                }
                if (childSec === "supplier") {
                  return userPermissions.includes("suppliers");
                }
                if (childSec === "bank-accounts") {
                  return userPermissions.includes("bank_accounts");
                }
                return true;
              });

              if (visibleChildren.length === 0) return null;

              return (
                <Collapsible
                  key={item.path}
                  open={contactsOpen}
                  onOpenChange={setContactsOpen}
                  className="space-y-1"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        contactsActive
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          contactsOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      contactsOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="mt-1 space-y-1 border-l border-sidebar-border pl-4 pb-1">
                      {visibleChildren.map((child) => {
                        const childSection = new URLSearchParams(new URL(child.path, "http://localhost").search).get("section");
                        const childActive = location.pathname === "/contacts" && activeSection === childSection;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                              childActive
                                ? "bg-primary/10 text-primary"
                                : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            <span className="flex-1">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* Sign Out */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-foreground"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Branch Switcher */}
          <BranchSelector />

          <div className="flex-1" />

          {/* AI Invoice Scanner Topbar Quick Button (Permitted staff only) */}
          {(isOwner || userPermissions.includes("ai_scanner")) && (
            <div className="hidden sm:block">
              <AiInvoiceParserDialog />
            </div>
          )}


          {/* User profile dropdown */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/50 transition-colors focus:outline-none">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {user?.name ?? "Owner"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role ?? "Admin"}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {avatarInitial}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => setChangePasswordOpen(true)}
                  className="cursor-pointer"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Global Modals */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};

export default DashboardLayout;

