"use client";

import { useRef, useState } from "react";
import type { OfferAttachment } from "@/features/offres/types";
import { humanFileSize, formatDateTime } from "@/lib/format";

type OfferAttachmentsPanelProps = {
  attachments: OfferAttachment[];
  onUpload: (files: FileList | File[]) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  onDownload: (attachmentId: string) => Promise<void>;
  isLoading?: boolean;
};

export function OfferAttachmentsPanel({
  attachments,
  onUpload,
  onDelete,
  onDownload,
  isLoading,
}: OfferAttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      setPanelMessage(null);
      await onUpload(files);
    } catch (error) {
      setPanelMessage(
        error instanceof Error ? error.message : "Impossible d'ajouter le fichier."
      );
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer?.files) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleDownload = async (attachmentId: string) => {
    try {
      await onDownload(attachmentId);
    } catch (error) {
      setPanelMessage(
        error instanceof Error ? error.message : "Téléchargement impossible."
      );
    }
  };

  const handleDelete = async (attachmentId: string) => {
    const confirmed = window.confirm("Supprimer ce document ?");
    if (!confirmed) return;
    try {
      await onDelete(attachmentId);
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : "Suppression impossible.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">Documents de l'offre</p>
        <p className="text-xs text-slate-500">
          Uploadez des documents annexes pour cette offre.
        </p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragActive
            ? "border-slate-900 bg-slate-50"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">
          Glissez vos documents ici ou
          <button
            type="button"
            className="ml-1 text-slate-900 underline"
            onClick={() => inputRef.current?.click()}
          >
            sélectionnez un fichier
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Formats acceptés: PDF, images, documents. Taille max 20 Mo.
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              handleFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
      </div>

      {panelMessage && (
        <p className="text-sm text-rose-600">{panelMessage}</p>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Annexes ({attachments.length})
        </p>
        {attachments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            Aucun document joint pour cette offre.
          </p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{attachment.filename}</p>
                  <p className="text-xs text-slate-500">
                    {humanFileSize(attachment.length)} • {formatDateTime(attachment.uploadedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  onClick={() => handleDownload(attachment.id)}
                  disabled={isLoading}
                >
                  Télécharger
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={isLoading}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

