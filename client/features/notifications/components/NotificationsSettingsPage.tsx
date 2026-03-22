"use client";

import { useState } from "react";
import { EditableSettingsList } from "@/features/settings/components/EditableSettingsList";

export function NotificationsSettingsPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setMessage(null);
      const res = await fetch("/api/notify-hotel-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Échec du test." });
      } else {
        setMessage({ type: "success", text: data.message ?? "Email test envoyé avec succès." });
      }
    } catch {
      setMessage({ type: "error", text: "Impossible d'envoyer l'email test." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configurez les destinataires des notifications lorsqu&apos;un hôtel répond à une offre.
        </p>
      </div>

      {/* SMTP status + test */}
      <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
        <header className="mb-4 space-y-1">
          <p className="text-sm font-semibold text-slate-900">Serveur de messagerie</p>
          <p className="text-sm text-slate-500">
            La configuration SMTP est gérée par les variables d&apos;environnement du serveur.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTesting ? "Envoi en cours..." : "Envoyer un email test"}
          </button>

          {message && (
            <p
              className={`text-sm font-medium ${
                message.type === "success" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </section>

      {/* Recipients */}
      <EditableSettingsList
        type="emailNotification"
        title="Destinataires des notifications"
        description="Adresses email qui recevront un email lorsqu'un hôtel répond à une offre."
        placeholder="email@exemple.com"
        emptyMessage="Aucun destinataire enregistré pour l'instant."
      />
    </div>
  );
}
