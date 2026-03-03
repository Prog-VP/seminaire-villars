"use client";

import { useEffect, useState } from "react";
import { fetchAppConfig, saveAppConfig } from "../api";
import { EditableSettingsList } from "@/features/settings/components/EditableSettingsList";

const SMTP_KEYS = [
  { key: "smtp_host", label: "Hôte SMTP", placeholder: "smtp.example.com" },
  { key: "smtp_port", label: "Port", placeholder: "587" },
  { key: "smtp_user", label: "Utilisateur", placeholder: "user@example.com" },
  { key: "smtp_pass", label: "Mot de passe", placeholder: "", type: "password" as const },
  { key: "smtp_from", label: "Adresse expéditeur", placeholder: "noreply@example.com" },
];

export function NotificationsSettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAppConfig()
      .then(setConfig)
      .catch(() => setMessage({ type: "error", text: "Impossible de charger la configuration." }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      for (const { key } of SMTP_KEYS) {
        const value = config[key]?.trim() ?? "";
        if (value) {
          await saveAppConfig(key, value);
        }
      }
      setMessage({ type: "success", text: "Configuration SMTP enregistrée." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur lors de l'enregistrement.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
          Configurez l&apos;envoi d&apos;emails de notification lorsqu&apos;un hôtel répond à une offre.
        </p>
      </div>

      {/* SMTP Config */}
      <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
        <header className="mb-4 space-y-1">
          <p className="text-sm font-semibold text-slate-900">Configuration SMTP</p>
          <p className="text-sm text-slate-500">
            Paramètres du serveur de messagerie pour l&apos;envoi des notifications.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {SMTP_KEYS.map(({ key, label, placeholder, type }) => (
                <label key={key} className="block text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <input
                    type={type ?? "text"}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder={placeholder}
                    value={config[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTesting ? "Envoi en cours..." : "Tester la connexion"}
              </button>
            </div>

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
        )}
      </section>

      {/* Recipients */}
      <EditableSettingsList
        type="emailNotification"
        title="Destinataires des notifications"
        description="Adresses email qui recevront un email lorsqu'un hôtel répond à une offre."
        placeholder="email@exemple.com"
      />
    </div>
  );
}
