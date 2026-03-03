"use client";

import { useCallback, useState } from "react";
import type { Offer } from "@/features/offres/types";
import type { OfferBrochure } from "../types";
import {
  fetchOfferBrochure,
  updateOfferBrochure,
  deleteOfferBrochure,
  createOfferBrochure,
} from "../api";
import { fetchBrochureTemplate } from "../api";
import { BrochureEditor } from "./BrochureEditor";
import { CreateBrochureDialog } from "./CreateBrochureDialog";
import type { BrochureSection } from "../types";

type Props = {
  offer: Offer;
  onTokenCreated?: (token: string) => void;
};

export function BrochureTab({ offer, onTokenCreated }: Props) {
  const [brochure, setBrochure] = useState<OfferBrochure | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load brochure on first render
  const loadBrochure = useCallback(async () => {
    if (isLoaded) return;
    setIsLoading(true);
    try {
      const data = await fetchOfferBrochure(offer.id);
      setBrochure(data);
    } catch {
      // no brochure yet
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [offer.id, isLoaded]);

  // Trigger load
  if (!isLoaded && !isLoading) {
    loadBrochure();
  }

  const handleSave = async (sections: BrochureSection[]) => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateOfferBrochure(offer.id, sections);
      setBrochure((prev) => (prev ? { ...prev, sections } : prev));
      setMessage({ type: "success", text: "Brochure sauvegardée." });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Impossible de sauvegarder la brochure.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!offer.shareToken) return;
    const url = `${window.location.origin}/partage/offre-client/${offer.shareToken}?brochure=1`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    if (!offer.shareToken) return;
    const url = `${window.location.origin}/partage/offre-client/${offer.shareToken}?brochure=1`;
    await navigator.clipboard.writeText(url);
  };

  const handleReset = async () => {
    if (!brochure) return;
    setIsSaving(true);
    setMessage(null);
    try {
      // Re-fetch the template
      const template = await fetchBrochureTemplate(
        brochure.destination,
        brochure.lang
      );
      if (template) {
        await updateOfferBrochure(offer.id, template.sections);
        setBrochure((prev) =>
          prev ? { ...prev, sections: template.sections } : prev
        );
        setMessage({
          type: "success",
          text: "Brochure réinitialisée depuis le modèle.",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Impossible de réinitialiser.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Chargement…</p>
      </div>
    );
  }

  // No brochure yet — show create button
  if (!brochure) {
    return (
      <>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <svg
              className="h-6 w-6 text-brand-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Aucune brochure
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Créez une brochure personnalisée pour cette offre.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="mt-4 rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600"
          >
            Créer la brochure
          </button>
        </div>

        {showCreateDialog && (
          <CreateBrochureDialog
            offer={offer}
            onClose={() => setShowCreateDialog(false)}
            onCreated={(b) => {
              setBrochure(b);
              setShowCreateDialog(false);
              setMessage({
                type: "success",
                text: "Brochure créée avec succès.",
              });
            }}
            onTokenCreated={onTokenCreated}
          />
        )}
      </>
    );
  }

  // Brochure exists — show editor
  return (
    <div className="space-y-4">
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
        sections={brochure.sections}
        destination={brochure.destination}
        lang={brochure.lang}
        onSave={handleSave}
        onPreview={handlePreview}
        onCopyLink={offer.shareToken ? handleCopyLink : undefined}
        onReset={handleReset}
        isSaving={isSaving}
      />
    </div>
  );
}
