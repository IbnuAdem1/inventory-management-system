// src/contexts/AuthContext.tsx
//
// Global authentication state for the entire app.
// Any component can call useAuth() to get the current user,
// check if they're logged in, or trigger login/logout.
//
// Phase 4 note: replace the MOCK_CREDENTIALS block and the login()
// function body with: const { data, error } = await supabase.auth.signInWithPassword({ email, password })

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface User {
  email: string;
  name: string;
  role: "owner" | "worker";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// MOCK CREDENTIALS
// TODO (Phase 4): delete this and replace login() with a real Supabase call
// ─────────────────────────────────────────────

const MOCK_CREDENTIALS = {
  email: "owner@autopartspro.com",
  password: "admin123",
  user: {
    email: "owner@autopartspro.com",
    name: "Owner",
    role: "owner" as const,
  },
};

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On startup: restore session from localStorage so the user
  // stays logged in after a page refresh
  useEffect(() => {
    const saved = localStorage.getItem("autoparts_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved) as User);
      } catch {
        localStorage.removeItem("autoparts_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // TODO (Phase 4): replace with supabase.auth.signInWithPassword()
    if (
      email.trim().toLowerCase() === MOCK_CREDENTIALS.email &&
      password === MOCK_CREDENTIALS.password
    ) {
      setUser(MOCK_CREDENTIALS.user);
      localStorage.setItem(
        "autoparts_user",
        JSON.stringify(MOCK_CREDENTIALS.user)
      );
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("autoparts_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
}
