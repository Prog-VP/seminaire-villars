"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export function AccessGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("from") || "/offres";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "forgot-password">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de se connecter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Impossible d'envoyer l'email de réinitialisation.");
      }

      setMessage(
        "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer l'email de réinitialisation."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: "login" | "forgot-password") => {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-white/70 bg-white/80 p-8 text-center shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
        <div className="space-y-3">
          <Image src="/logo.png" alt="Villars Les Diablerets" width={160} height={54} className="mx-auto object-contain" />
          <h1 className="text-xl font-semibold text-slate-900">
            Connexion
          </h1>
          <p className="text-sm text-slate-500">
            Connectez-vous pour accéder au dashboard.
          </p>
        </div>

        <form
          onSubmit={mode === "login" ? handleSubmit : handleForgotPassword}
          className="space-y-4 text-left"
        >
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="vous@exemple.com"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </label>

          {mode === "login" && (
            <label className="block text-sm font-medium text-slate-700">
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </label>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "login"
              ? isSubmitting ? "Connexion..." : "Se connecter"
              : isSubmitting ? "Envoi..." : "Recevoir un lien"}
          </button>

          {mode === "login" ? (
            <button
              type="button"
              onClick={() => switchMode("forgot-password")}
              className="w-full text-center text-sm font-medium text-brand-900 hover:text-brand-700"
            >
              Mot de passe oublié ?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full text-center text-sm font-medium text-brand-900 hover:text-brand-700"
            >
              Retour à la connexion
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
