"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUsersWithRoles } from "../api";
import { useUserRole } from "../context";
import type { UserProfile } from "../types";
import { CreateUserForm } from "./CreateUserForm";
import { UserTable } from "./UserTable";

export function UsersPage() {
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>();

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUsersWithRoles();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    async function getCurrentUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    void getCurrentUser();
  }, []);

  if (isRoleLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
        Chargement...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-500">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {isAdmin && <CreateUserForm onCreated={loadUsers} />}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          Chargement des utilisateurs...
        </div>
      ) : (
        <UserTable
          users={users}
          currentUserId={currentUserId}
          onRefresh={loadUsers}
        />
      )}
    </section>
  );
}
