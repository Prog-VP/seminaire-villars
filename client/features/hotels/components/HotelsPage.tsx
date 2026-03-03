"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hotel, HotelDocument } from "../types";
import {
  fetchHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} from "../api";
import {
  fetchAllHotelDocuments,
  uploadHotelDocument,
  deleteHotelDocument,
  downloadHotelDocument,
} from "@/features/documents/api";

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelDocs, setHotelDocs] = useState<HotelDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [hotelsData, docsData] = await Promise.all([
        fetchHotels(),
        fetchAllHotelDocuments(),
      ]);
      setHotels(hotelsData);
      setHotelDocs(docsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les hôtels."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (nom: string, email: string) => {
    const created = await createHotel(nom, email || null);
    setHotels((prev) =>
      [...prev, created].sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      )
    );
  };

  const handleUpdate = async (
    id: string,
    fields: { nom: string; email: string | null }
  ) => {
    const updated = await updateHotel(id, fields);
    setHotels((prev) => {
      const next = prev.map((h) => (h.id === id ? updated : h));
      next.sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      );
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await deleteHotel(id);
    setHotels((prev) => prev.filter((h) => h.id !== id));
    setHotelDocs((prev) => prev.filter((d) => d.hotelId !== id));
  };

  const handleUploadDoc = async (hotelId: string, lang: string, file: File) => {
    const doc = await uploadHotelDocument(hotelId, lang, file);
    setHotelDocs((prev) => {
      // Remove existing doc for same hotel+lang, add new one
      const filtered = prev.filter(
        (d) => !(d.hotelId === hotelId && d.lang === lang)
      );
      return [...filtered, doc];
    });
  };

  const handleDeleteDoc = async (doc: HotelDocument) => {
    await deleteHotelDocument(doc.id, doc.filePath);
    setHotelDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const handleDownloadDoc = async (doc: HotelDocument) => {
    const blob = await downloadHotelDocument(doc.filePath);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.filePath.split("/").pop() ?? "document.docx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      <CreateHotelForm onCreate={handleCreate} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nom
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Documents
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Chargement…
                </td>
              </tr>
            ) : hotels.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Aucun hôtel enregistré pour l&apos;instant.
                </td>
              </tr>
            ) : (
              hotels.map((hotel) => (
                <HotelRow
                  key={hotel.id}
                  hotel={hotel}
                  docs={hotelDocs.filter((d) => d.hotelId === hotel.id)}
                  onSave={(fields) => handleUpdate(hotel.id, fields)}
                  onDelete={() => handleDelete(hotel.id)}
                  onUploadDoc={(lang, file) =>
                    handleUploadDoc(hotel.id, lang, file)
                  }
                  onDeleteDoc={handleDeleteDoc}
                  onDownloadDoc={handleDownloadDoc}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline create form                                                 */
/* ------------------------------------------------------------------ */

function CreateHotelForm({
  onCreate,
}: {
  onCreate: (nom: string, email: string) => Promise<void>;
}) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
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
      await onCreate(nom.trim(), email.trim());
      setNom("");
      setEmail("");
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

/* ------------------------------------------------------------------ */
/*  Editable row                                                       */
/* ------------------------------------------------------------------ */

const ALL_LANGS = ["fr", "en", "de"] as const;

function HotelRow({
  hotel,
  docs,
  onSave,
  onDelete,
  onUploadDoc,
  onDeleteDoc,
  onDownloadDoc,
}: {
  hotel: Hotel;
  docs: HotelDocument[];
  onSave: (fields: { nom: string; email: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onUploadDoc: (lang: string, file: File) => Promise<void>;
  onDeleteDoc: (doc: HotelDocument) => Promise<void>;
  onDownloadDoc: (doc: HotelDocument) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState(hotel.nom);
  const [email, setEmail] = useState(hotel.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const [uploadLang, setUploadLang] = useState<string | null>(null);
  const [uploadingLang, setUploadingLang] = useState<string | null>(null);

  useEffect(() => {
    setNom(hotel.nom);
    setEmail(hotel.email ?? "");
  }, [hotel.nom, hotel.email]);

  const handleSave = async () => {
    if (!nom.trim()) {
      setError("Le nom ne peut pas être vide.");
      return;
    }
    try {
      setStatus("saving");
      setError(null);
      await onSave({ nom: nom.trim(), email: email.trim() || null });
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer."
      );
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async () => {
    const confirmation = window.confirm(
      `Supprimer l'hôtel « ${hotel.nom} » ?`
    );
    if (!confirmation) return;
    try {
      setStatus("deleting");
      await onDelete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer."
      );
    } finally {
      setStatus("idle");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNom(hotel.nom);
    setEmail(hotel.email ?? "");
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
          <td colSpan={4} className="px-5 pb-2">
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared icon button (same pattern as EditableSettingsList)           */
/* ------------------------------------------------------------------ */

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  icon: "edit" | "trash" | "check" | "close";
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50";
  const danger =
    "border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-100";
  const defaultTone = "border-slate-200 hover:text-slate-900";
  return (
    <button
      type="button"
      className={`${base} ${tone === "danger" ? danger : defaultTone}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {renderIcon(icon)}
    </button>
  );
}

function renderIcon(name: "edit" | "trash" | "check" | "close") {
  switch (name) {
    case "edit":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M15.232 5.232l3.536 3.536" />
          <path d="M4 20l4.243-.707 11.314-11.314-3.536-3.536L4.707 15.757 4 20z" />
        </svg>
      );
    case "trash":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M6 7h12" strokeLinecap="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          <path d="M8 7V5h8v2" />
          <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "check":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "close":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
