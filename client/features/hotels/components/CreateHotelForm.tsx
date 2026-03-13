"use client";

import { useState } from "react";

export function CreateHotelForm({
  onCreate,
  destinations,
}: {
  onCreate: (nom: string, email: string, destination: string) => Promise<void>;
  destinations: string[];
}) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError("Veuillez saisir un nom.");
      return;
    }
    try {
      setIsCreating(true);
      setError(null);
      await onCreate(nom.trim(), email.trim(), destination);
      setNom("");
      setEmail("");
      setDestination("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'ajouter cet hôtel."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
      <header className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-slate-900">Ajouter un hôtel</p>
      </header>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={handleSubmit}
      >
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Nom de l'hôtel"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          disabled={isCreating}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          disabled={isCreating}
        >
          <option value="">Destination…</option>
          {destinations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input
          type="email"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Email (optionnel)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isCreating}
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isCreating}
        >
          {isCreating ? "Ajout…" : "Ajouter"}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
