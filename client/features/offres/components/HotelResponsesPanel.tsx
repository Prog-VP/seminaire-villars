"use client";

import { useMemo, useState } from "react";
import type { HotelResponse, OfferHotelSend } from "../types";
import { formatDateTime } from "@/lib/format";
import { ResponseEditForm } from "./ResponseEditForm";
import type { ResponseEditFormState } from "./ResponseEditForm";
import { SentHotelsList } from "./SentHotelsList";

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
  const [editForm, setEditForm] = useState<ResponseEditFormState>({
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
      <SentHotelsList
        sends={sends}
        shareUrl={shareUrl}
        onOpenShareDialog={onOpenShareDialog}
      />

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
                  <ResponseEditForm
                    response={response}
                    editForm={editForm}
                    onEditChange={handleEditChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onResetOfferText={() => {
                      setEditForm((prev) => ({ ...prev, offerText: editForm.message }));
                    }}
                    onDelete={handleDelete}
                    editingId={editingId}
                    isSaving={isSaving}
                    isBusy={isBusy}
                    onUpdateResponse={!!onUpdateResponse}
                    onDeleteResponse={!!onDeleteResponse}
                  />
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
