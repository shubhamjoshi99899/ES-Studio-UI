"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, authApi, AuthUser, getCurrentWorkspaceId } from "@/lib/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isAuthenticated: boolean;
  error: string;
  refreshAuth: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [error, setError] = useState("");

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.me();

      setUser(response);
      setIsOnboarded(getCurrentWorkspaceId(response) != null);
      return response;
    } catch (error) {
      setUser(null);
      setIsOnboarded(false);

      if (error instanceof ApiError && error.status !== 401) {
        setError(error.message);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isOnboarded,
      isAuthenticated: user != null,
      error,
      refreshAuth,
      setUser,
    }),
    [error, isLoading, isOnboarded, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
