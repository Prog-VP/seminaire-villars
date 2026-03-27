"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash;

    if (!hash) {
      setError("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
      return;
    }

    // Sign out any existing session first, then set the invite session
    supabase.auth.signOut().then(() =>
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    ).then(({ error: sessionError }) => {
      if (sessionError) {
        setError("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
      } else {
        // Clear the hash from the URL to avoid reuse
        window.history.replaceState(null, "", window.location.pathname);
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/offres"), 2000);
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-lg font-semibold text-slate-900">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {success ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            Mot de passe mis à jour. Redirection...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                disabled={!ready}
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-medium text-slate-600">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                disabled={!ready}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
