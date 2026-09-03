import React from "react";
import { Store, ChevronDown, Check } from "lucide-react";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export const BranchSelector: React.FC = () => {
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isSingleBranchWorker = user?.role === "worker" && user.branchId;

  if (isSingleBranchWorker && !isOwner) {
    const assignedBranch = branches.find((b) => b.id === user.branchId);
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
        <Store className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="font-semibold">{assignedBranch?.name || "Assigned Branch"}</span>
        {assignedBranch?.code && (
          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono border-primary/40 bg-primary/10">
            {assignedBranch.code}
          </Badge>
        )}
      </div>
    );
  }

  const activeBranchName =
    activeBranchId === "all"
      ? "All Stores / Branches"
      : branches.find((b) => b.id === activeBranchId)?.name || "Select Branch";


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Select Store Branch"
        >
          <Store className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="max-w-[140px] truncate">{activeBranchName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Store Branch
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* All Branches option */}
        <DropdownMenuItem
          onClick={() => setActiveBranchId("all")}
          className="flex items-center justify-between cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">All Stores (Consolidated)</span>
          </div>
          {activeBranchId === "all" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Individual branches */}
        {branches.map((b) => {
          const isSelected = activeBranchId === b.id;
          return (
            <DropdownMenuItem
              key={b.id}
              onClick={() => setActiveBranchId(b.id)}
              className="flex items-center justify-between cursor-pointer text-xs"
            >
              <div className="flex flex-col">
                <span className="font-medium">{b.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {b.address || b.code}
                </span>
              </div>
              {isSelected ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                  {b.code}
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BranchSelector;
