"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserRole } from "./types";
import { fetchMyRole } from "./api";

type UserRoleContextValue = {
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(
  undefined
);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const r = await fetchMyRole();
      setRole(r);
    } catch {
      setRole("standard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({ role, isAdmin: role === "admin", isLoading }),
    [role, isLoading]
  );

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
}
