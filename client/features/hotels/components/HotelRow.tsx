"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Hotel, HotelDocument } from "../types";
import { countOffersUsingHotel } from "../api";
import { IconButton } from "@/components/ui/IconButton";
import { INITIAL_FILTERS } from "@/features/offres/hooks/useOfferFiltering";

const ALL_LANGS = ["fr", "en", "de"] as const;

export function HotelRow({
  hotel,
  docs,
  destinations,
  onSave,
  onDelete,
  onUploadDoc,
  onDeleteDoc,
  onDownloadDoc,
}: {
  hotel: Hotel;
  docs: HotelDocument[];
  destinations: string[];
  onSave: (fields: { nom: string; email: string | null; destination: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onUploadDoc: (lang: string, file: File) => Promise<void>;
  onDeleteDoc: (doc: HotelDocument) => Promise<void>;
  onDownloadDoc: (doc: HotelDocument) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState(hotel.nom);
  const [email, setEmail] = useState(hotel.email ?? "");
  const [destination, setDestination] = useState(hotel.destination ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const [uploadLang, setUploadLang] = useState<string | null>(null);
  const [uploadingLang, setUploadingLang] = useState<string | null>(null);

  useEffect(() => {
    setNom(hotel.nom);
    setEmail(hotel.email ?? "");
    setDestination(hotel.destination ?? "");
  }, [hotel.nom, hotel.email, hotel.destination]);

  const handleSave = async () => {
    if (!nom.trim()) {
      setError("Le nom ne peut pas être vide.");
      return;
    }
    try {
      setStatus("saving");
      setError(null);
      await onSave({
        nom: nom.trim(),
        email: email.trim() || null,
        destination: destination.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer."
      );
    } finally {
      setStatus("idle");
    }
  };

  const [usageCount, setUsageCount] = useState<number | null>(null);

  const handleDelete = async () => {
    try {
      setStatus("deleting");
      setError(null);
      setUsageCount(null);
      const count = await countOffersUsingHotel(hotel.id);
      if (count > 0) {
        setUsageCount(count);
        setStatus("idle");
        return;
      }
      const confirmation = window.confirm(
        `Supprimer l'hôtel « ${hotel.nom} » ?`
      );
      if (!confirmation) {
        setStatus("idle");
        return;
      }
      await onDelete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer."
      );
    } finally {
      setStatus("idle");
    }
  };

  const handleViewOffers = () => {
    const filters = { ...INITIAL_FILTERS, hotelContacte: hotel.nom };
    sessionStorage.setItem("offer-filters", JSON.stringify(filters));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNom(hotel.nom);
    setEmail(hotel.email ?? "");
    setDestination(hotel.destination ?? "");
    setError(null);
  };

  const handleFileSelected = async (lang: string, file: File) => {
    try {
      setUploadingLang(lang);
      setUploadLang(null);
      setError(null);
      await onUploadDoc(lang, file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'uploader le document."
      );
    } finally {
      setUploadingLang(null);
    }
  };

  const handleDeleteDoc = async (doc: HotelDocument) => {
    const confirmed = window.confirm(`Supprimer le document ${doc.lang.toUpperCase()} ?`);
    if (!confirmed) return;
    try {
      setError(null);
      await onDeleteDoc(doc);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer le document."
      );
    }
  };

  const docsByLang = new Map(docs.map((d) => [d.lang, d]));

  return (
    <>
      <tr className="group">
        {isEditing ? (
          <>
            <td className="px-5 py-3">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={status === "saving"}
              />
            </td>
            <td className="px-5 py-3">
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={status === "saving"}
              >
                <option value="">—</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </td>
            <td className="px-5 py-3">
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "saving"}
              />
            </td>
            <td className="px-5 py-3" />
            <td className="px-5 py-3">
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  label="Enregistrer"
                  icon="check"
                  onClick={handleSave}
                  disabled={status === "saving"}
                />
                <IconButton
                  label="Annuler"
                  icon="close"
                  onClick={handleCancel}
                  disabled={status === "saving"}
                />
              </div>
            </td>
          </>
        ) : (
          <>
            <td className="px-5 py-3.5 font-medium text-slate-900">
              {hotel.nom}
            </td>
            <td className="px-5 py-3.5">
              {hotel.destination ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {hotel.destination}
                </span>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </td>
            <td className="px-5 py-3.5 text-slate-500">
              {hotel.email ?? "—"}
            </td>
            <td className="px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {ALL_LANGS.map((lang) => {
                  const doc = docsByLang.get(lang);
                  const isThisUploading = uploadingLang === lang;

                  if (isThisUploading) {
                    return (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700"
                      >
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                        {lang}
                      </span>
                    );
                  }

                  if (doc) {
                    return (
                      <span
                        key={lang}
                        className="group/badge inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
                      >
                        <button
                          type="button"
                          onClick={() => onDownloadDoc(doc)}
                          className="hover:underline"
                          title="Télécharger"
                        >
                          {lang}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc)}
                          className="ml-0.5 text-emerald-500 transition hover:text-red-600"
                          title="Supprimer"
                        >
                          &times;
                        </button>
                      </span>
                    );
                  }

                  return (
                    <span key={lang} className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => setUploadLang(uploadLang === lang ? null : lang)}
                        disabled={uploadingLang !== null}
                        className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition hover:border-slate-400 hover:text-slate-600 disabled:opacity-50"
                        title={`Ajouter document ${lang.toUpperCase()}`}
                      >
                        {lang}
                        <span className="ml-0.5">+</span>
                      </button>
                      {uploadLang === lang && (
                        <input
                          type="file"
                          accept=".docx,.doc"
                          className="ml-1.5 w-36 text-xs text-slate-500"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelected(lang, file);
                          }}
                        />
                      )}
                    </span>
                  );
                })}
              </div>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  label="Modifier"
                  icon="edit"
                  onClick={() => setIsEditing(true)}
                />
                <IconButton
                  label="Supprimer"
                  icon="trash"
                  onClick={handleDelete}
                  disabled={status === "deleting"}
                  tone="danger"
                />
              </div>
            </td>
          </>
        )}
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className="px-5 pb-2">
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          </td>
        </tr>
      )}
      {usageCount !== null && usageCount > 0 && (
        <tr>
          <td colSpan={5} className="px-5 pb-2">
            <p className="text-sm text-amber-700" role="alert">
              Suppression impossible : cet hôtel est lié à{" "}
              <Link
                href="/offres"
                onClick={handleViewOffers}
                className="font-medium underline hover:text-amber-900"
              >
                {usageCount} offre{usageCount > 1 ? "s" : ""}
              </Link>.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
