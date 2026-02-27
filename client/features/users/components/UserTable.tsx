"use client";

import { useState } from "react";
import { deleteUser } from "../api";
import type { UserProfile } from "../types";
import { useUserRole } from "../context";
import { EditUserModal } from "./EditUserModal";

type Props = {
  users: UserProfile[];
  currentUserId: string | undefined;
  onRefresh: () => void;
};

export function UserTable({ users, currentUserId, onRefresh }: Props) {
  const { isAdmin } = useUserRole();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(user: UserProfile) {
    if (user.id === currentUserId) return;
    if (!confirm(`Supprimer ${user.email} ?`)) return;

    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              {isAdmin && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {user.email}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-slate-400">(vous)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Standard"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(user.created_at)}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        Modifier
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === user.id ? "..." : "Supprimer"}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 4 : 3}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}
