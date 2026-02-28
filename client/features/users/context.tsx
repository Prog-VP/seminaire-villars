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
import { fetchMyProfile } from "./api";

type UserRoleContextValue = {
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  nom: string;
  prenom: string;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(
  undefined
);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await fetchMyProfile();
      setRole(profile.role);
      setNom(profile.nom);
      setPrenom(profile.prenom);
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
    () => ({ role, isAdmin: role === "admin", isLoading, nom, prenom }),
    [role, isLoading, nom, prenom]
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
