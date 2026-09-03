import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from "@/lib/api";

interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "WORKER";
  branchId?: string | null;
  permissions?: string[];
}

interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "worker";
  branchId?: string | null;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const USER_KEY = "autoparts_user";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase() as User["role"],
    branchId: user.branchId,
    permissions: user.permissions || ["sales", "inventory_view", "credits", "customers"],
  };
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        localStorage.removeItem(USER_KEY);
        setIsLoading(false);
        return;
      }

      try {
        const apiUser = await apiFetch<ApiUser>("/auth/me");
        const mappedUser = mapUser(apiUser);
        setUser(mappedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      } catch {
        setUser(null);
        clearAuthToken();
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      const mappedUser = mapUser(result.user);

      setAuthToken(result.token);
      setUser(mappedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      return { success: true };
    } catch (err: any) {
      const message =
        err?.message || "Invalid email or password. Please try again.";
      return { success: false, error: message };
    }
  };


  const logout = () => {
    setUser(null);
    clearAuthToken();
    localStorage.removeItem(USER_KEY);
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
}
