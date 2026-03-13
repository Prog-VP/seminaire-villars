"use client";

import { useState } from "react";
import { createUser } from "../api";
import type { UserRole } from "../types";

type Props = {
  onCreated: () => void;
};

export function CreateUserForm({ onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("standard");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createUser(email, role, nom, prenom);
      setSuccess(`Invitation envoyée à ${email}.`);
      setEmail("");
      setRole("standard");
      setNom("");
      setPrenom("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Inviter un utilisateur
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="new-prenom" className="block text-xs font-medium text-slate-600">
            Prénom
          </label>
          <input
            id="new-prenom"
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Prénom"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-nom" className="block text-xs font-medium text-slate-600">
            Nom
          </label>
          <input
            id="new-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-email" className="block text-xs font-medium text-slate-600">
            Email
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="utilisateur@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-role" className="block text-xs font-medium text-slate-600">
            Rôle
          </label>
          <select
            id="new-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={inputClass}
          >
            <option value="standard">Standard</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? "Envoi..." : "Inviter"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}
    </form>
  );
}
