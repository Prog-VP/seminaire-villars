"use client";

import { useEffect, useState } from "react";
import { updateUser } from "../api";
import type { UserProfile, UserRole } from "../types";

type Props = {
  user: UserProfile;
  onClose: () => void;
  onUpdated: () => void;
};

export function EditUserModal({ user, onClose, onUpdated }: Props) {
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [nom, setNom] = useState(user.nom ?? "");
  const [prenom, setPrenom] = useState(user.prenom ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: { email?: string; role?: UserRole; nom?: string; prenom?: string } = {};
      if (email !== user.email) payload.email = email;
      if (role !== user.role) payload.role = role;
      if (nom !== (user.nom ?? "")) payload.nom = nom;
      if (prenom !== (user.prenom ?? "")) payload.prenom = prenom;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await updateUser(user.id, payload);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">
          Modifier l&apos;utilisateur
        </h2>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-prenom" className="block text-xs font-medium text-slate-600">
                Prénom
              </label>
              <input
                id="edit-prenom"
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="edit-nom" className="block text-xs font-medium text-slate-600">
                Nom
              </label>
              <input
                id="edit-nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-email" className="block text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-xs font-medium text-slate-600">
              Rôle
            </label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={inputClass}
            >
              <option value="standard">Standard</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
