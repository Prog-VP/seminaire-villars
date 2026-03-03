"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBrochureTemplates,
  updateBrochureTemplate,
} from "@/features/brochure/api";
import { BrochureEditor } from "@/features/brochure/components/BrochureEditor";
import type { BrochureTemplate, BrochureSection } from "@/features/brochure/types";
import { destinationLabel } from "@/features/brochure/utils";

const LANG_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
};

export default function BrochureSettingsPage() {
  const [templates, setTemplates] = useState<BrochureTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBrochureTemplates();
      setTemplates(data);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Impossible de charger les modèles.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = templates.find((t) => t.id === selectedId);

  const handleSave = async (sections: BrochureSection[]) => {
    if (!selected) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await updateBrochureTemplate(selected.id, sections);
      setTemplates((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, sections } : t))
      );
      setMessage({ type: "success", text: "Modèle sauvegardé." });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Impossible de sauvegarder le modèle.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Modèles de brochure
        </h1>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chargement…
        </div>
      </div>
    );
  }

  // List view
  if (!selected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Modèles de brochure
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les modèles de base par destination et langue. Les modifications
            n&apos;affectent pas les brochures déjà créées.
          </p>
        </div>

        {message && (
          <p
            className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {destinationLabel(t.destination)}
              </h3>
              <p className="text-sm text-slate-500">
                {LANG_LABELS[t.lang] ?? t.lang}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {t.sections.length} section{t.sections.length !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Aucun modèle trouvé. Exécutez la migration 015 pour créer les modèles
            de base.
          </div>
        )}
      </div>
    );
  }

  // Editor view
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setMessage(null);
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          ← Retour
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {destinationLabel(selected.destination)} — {LANG_LABELS[selected.lang] ?? selected.lang}
          </h1>
          <p className="text-xs text-slate-500">
            Modèle de base (les brochures existantes ne sont pas affectées)
          </p>
        </div>
      </div>

      {message && (
        <p
          className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <BrochureEditor
        sections={selected.sections}
        destination={selected.destination}
        lang={selected.lang}
        onSave={handleSave}
        onPreview={() => {
          // No preview for templates (they're not tied to an offer)
          alert(
            "L'aperçu n'est disponible que pour les brochures d'offres. Créez une brochure depuis une offre pour voir le rendu."
          );
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
