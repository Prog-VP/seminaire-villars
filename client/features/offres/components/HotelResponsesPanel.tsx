"use client";

import { useMemo, useState } from "react";
import type { HotelResponse, OfferHotelSend } from "../types";

type HotelResponsesPanelProps = {
  responses?: HotelResponse[];
  sends?: OfferHotelSend[];
  shareUrl?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onUpdateResponse?: (
    responseId: string,
    payload: {
      hotelName: string;
      respondentName?: string;
      message: string;
      offerText?: string | null;
    }
  ) => Promise<void>;
  onDeleteResponse?: (responseId: string) => Promise<void>;
  isBusy?: boolean;
  onOpenShareDialog?: () => void;
};

function formatDateTime(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-CH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("fr-CH");
  } catch {
    return value;
  }
}

export function HotelResponsesPanel({
  responses = [],
  sends = [],
  shareUrl,
  onRefresh,
  isRefreshing,
  onUpdateResponse,
  onDeleteResponse,
  isBusy,
  onOpenShareDialog,
}: HotelResponsesPanelProps) {
  const orderedResponses = useMemo(() => {
    return [...responses].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [responses]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    hotelName: "",
    respondentName: "",
    message: "",
    offerText: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [panelMessage, setPanelMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const handleEditClick = (response: HotelResponse) => {
    if (!response.id) return;
    setEditingId(response.id);
    setEditForm({
      hotelName: response.hotelName,
      respondentName: response.respondentName ?? "",
      message: response.message,
      offerText: response.offerText ?? response.message,
    });
    setPanelMessage(null);
  };

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!editingId || !onUpdateResponse) return;
    if (!editForm.hotelName.trim() || !editForm.message.trim()) {
      setPanelMessage({
        type: "error",
        text: "Merci de renseigner le nom de l'hôtel et la réponse.",
      });
      return;
    }
    try {
      setIsSaving(true);
      await onUpdateResponse(editingId, {
        hotelName: editForm.hotelName.trim(),
        respondentName: editForm.respondentName.trim() || undefined,
        message: editForm.message.trim(),
        offerText: editForm.offerText.trim() || null,
      });
      setPanelMessage({
        type: "success",
        text: "Réponse mise à jour.",
      });
      setEditingId(null);
    } catch (error) {
      setPanelMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "La mise à jour a échoué. Réessayez.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setPanelMessage(null);
  };

  const handleDelete = async (responseId: string) => {
    if (!onDeleteResponse) return;
    const confirmed = window.confirm("Supprimer cette réponse ?");
    if (!confirmed) return;
    try {
      await onDeleteResponse(responseId);
      setEditingId(null);
    } catch (error) {
      setPanelMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Suppression impossible pour le moment.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone 1: Hôtels contactés */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hôtels contactés
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {sends.length > 0
                ? `${sends.length} hôtel${sends.length > 1 ? "s" : ""}`
                : "Aucun envoi"}
            </h3>
          </div>
          {onOpenShareDialog && (
            <button
              type="button"
              onClick={onOpenShareDialog}
              className="ml-auto rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-3 py-1.5 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600"
            >
              Contacter des hôtels
            </button>
          )}
        </div>

        {/* Share link (always visible if it exists) */}
        {shareUrl && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Lien de partage
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                {linkCopied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
        )}

        {sends.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {sends.map((send) => (
              <li
                key={send.id}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {send.hotelName}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatDate(send.sentAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Aucun hôtel n&apos;a encore été contacté pour cette offre.
          </p>
        )}
      </section>

      {/* Zone 2: Réponses reçues */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Réponses reçues
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {responses.length > 0
                ? `${responses.length} réponse${responses.length > 1 ? "s" : ""}`
                : "Aucune réponse"}
            </h3>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              disabled={isRefreshing}
            >
              {isRefreshing ? "Actualisation…" : "Actualiser"}
            </button>
          )}
        </div>

        {responses.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Les hôtels contactés pourront répondre via le lien de partage.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {orderedResponses.map((response, index) => (
              <li
                key={`${response.hotelName}-${response.createdAt ?? index}`}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">
                    {response.hotelName}
                  </p>
                  {response.respondentName && <span>• {response.respondentName}</span>}
                  {response.createdAt && (
                    <span className="ml-auto text-xs text-slate-500">
                      {formatDateTime(response.createdAt)}
                    </span>
                  )}
                </div>

                {/* Réponse originale de l'hôtel (lecture seule) */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Réponse de l&apos;hôtel
                  </p>
                  <p className="mt-1 whitespace-pre-line rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    {response.message}
                  </p>
                </div>

                {/* Texte pour l'offre (éditable) */}
                {editingId === response.id ? (
                  <div className="mt-3 space-y-3 rounded-lg border border-brand-200 bg-brand-50/30 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nom de l&apos;hôtel
                        <input
                          name="hotelName"
                          value={editForm.hotelName}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Contact
                        <input
                          name="respondentName"
                          value={editForm.respondentName}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        />
                      </label>
                    </div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Texte pour l&apos;offre
                      <textarea
                        name="offerText"
                        value={editForm.offerText}
                        onChange={handleEditChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        rows={6}
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Ce texte sera utilisé dans le document d&apos;offre. La réponse originale de l&apos;hôtel n&apos;est pas modifiée.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || isBusy}
                        className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? "Enregistrement…" : "Enregistrer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm((prev) => ({ ...prev, offerText: editForm.message }));
                        }}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        title="Réinitialiser le texte offre avec la réponse originale"
                      >
                        Réinitialiser
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        Annuler
                      </button>
                      {onDeleteResponse && editingId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(editingId)}
                          className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                      Texte pour l&apos;offre
                      {response.offerText && response.offerText !== response.message && (
                        <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                          Personnalisé
                        </span>
                      )}
                    </p>
                    <p className="mt-1 whitespace-pre-line rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-slate-700">
                      {response.offerText ?? response.message}
                    </p>
                    {onUpdateResponse && response.id && (
                      <button
                        type="button"
                        onClick={() => handleEditClick(response)}
                        className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-700 underline-offset-4 hover:text-brand-900 hover:underline"
                      >
                        Modifier le texte offre
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {panelMessage && (
          <p
            className={`mt-4 text-sm ${
              panelMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {panelMessage.text}
          </p>
        )}
      </section>
    </div>
  );
}
