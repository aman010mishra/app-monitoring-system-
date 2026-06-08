import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions?: string[];
  lastLogin?: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("am_token");
    const storedUser = localStorage.getItem("am_user");
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setToken(storedToken);
        setUser(parsed);
        setAuthTokenGetter(() => storedToken);
      } catch {
        localStorage.removeItem("am_token");
        localStorage.removeItem("am_user");
      }
    }
    setIsLoading(false);
  }, []);

  function setAuth(u: User, t: string) {
    setUser(u);
    setToken(t);
    localStorage.setItem("am_token", t);
    localStorage.setItem("am_user", JSON.stringify(u));
    setAuthTokenGetter(() => t);
  }

  function clearAuth() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("am_token");
    localStorage.removeItem("am_user");
    setAuthTokenGetter(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, setAuth, clearAuth, isAdmin: user?.role === "admin", isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
