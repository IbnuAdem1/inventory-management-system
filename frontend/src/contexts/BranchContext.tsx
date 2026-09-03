import React, { createContext, useContext, useState, useEffect } from "react";
import { useBranchesQuery } from "@/hooks/useBranches";
import { useAuth } from "@/contexts/AuthContext";
import type { Branch } from "@/types";

interface BranchContextType {
  branches: Branch[];
  activeBranchId: string;
  activeBranch: Branch | null;
  setActiveBranchId: (id: string) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const ACTIVE_BRANCH_KEY = "autoparts_active_branch";

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "branch-main-store",
    name: "Main Store",
    code: "MAIN-01",
    address: "Bole Road, Building A",
    phone: "+251 91 123 4567",
    isDefault: true,
  },
  {
    id: "branch-second-store",
    name: "Downtown Branch",
    code: "DOWN-02",
    address: "Piazza Central, Shop #14",
    phone: "+251 91 765 4321",
    isDefault: false,
  },
];

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: serverBranches, isLoading } = useBranchesQuery();
  const { user } = useAuth();
  const branches = serverBranches && serverBranches.length > 0 ? serverBranches : DEFAULT_BRANCHES;

  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_BRANCH_KEY) || "all";
  });

  useEffect(() => {
    if (user?.role === "worker" && user.branchId) {
      setActiveBranchIdState(user.branchId);
    }
  }, [user]);

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    localStorage.setItem(ACTIVE_BRANCH_KEY, id);
  };


  const activeBranch =
    activeBranchId === "all"
      ? null
      : branches.find((b) => b.id === activeBranchId) || null;

  return (
    <BranchContext.Provider
      value={{
        branches,
        activeBranchId,
        activeBranch,
        setActiveBranchId,
        isLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export function useBranch(): BranchContextType {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
