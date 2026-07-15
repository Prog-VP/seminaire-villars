"use client";

import { useEffect, useMemo, useState } from "react";
import type { Hotel } from "@/features/hotels/types";
import { fetchHotels } from "@/features/hotels/api";
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
      hotelId?: string | null;
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

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ResponseEditFormState>({
    hotelName: "",
    respondentName: "",
    message: "",
    offerText: "",
  });
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savingAssociationIds, setSavingAssociationIds] = useState<Set<string>>(
    new Set()
  );
  const [panelMessage, setPanelMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchHotels()
      .then(setHotels)
      .catch(() => {
        setPanelMessage({
          type: "error",
          text: "Impossible de charger la liste des hôtels.",
        });
      });
  }, []);

  const sortedHotels = useMemo(
    () =>
      [...hotels].sort((a, b) => {
        const destinationCompare = (a.destination ?? "").localeCompare(b.destination ?? "", "fr", {
          sensitivity: "base",
        });
        if (destinationCompare !== 0) return destinationCompare;
        return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
      }),
    [hotels]
  );

  const hotelsById = useMemo(
    () => new Map(hotels.map((hotel) => [hotel.id, hotel])),
    [hotels]
  );

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEditClick = (response: HotelResponse) => {
    if (!response.id) return;
    setOpenIds((prev) => new Set(prev).add(response.id!));
    setEditingId(response.id);
    setEditForm({
      hotelName: response.hotelName,
      respondentName: response.respondentName ?? "",
      message: response.message,
      offerText: response.offerText ?? response.message,
    });
    setPanelMessage(null);
  };

  const handleEditChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleAssociationChange = async (response: HotelResponse, hotelId: string) => {
    const responseId = response.id;
    if (!responseId || !onUpdateResponse || isBusy || hotelId === (response.hotelId ?? "")) {
      return;
    }

    setSavingAssociationIds((prev) => {
      const next = new Set(prev);
      next.add(responseId);
      return next;
    });

    try {
      await onUpdateResponse(responseId, {
        hotelName: response.hotelName,
        hotelId: hotelId || null,
        respondentName: response.respondentName,
        message: response.message,
        offerText: response.offerText ?? null,
      });
      setPanelMessage({
        type: "success",
        text: "Liaison hôtel mise à jour.",
      });
    } catch (error) {
      setPanelMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour la liaison hôtel.",
      });
    } finally {
      setSavingAssociationIds((prev) => {
        const next = new Set(prev);
        next.delete(responseId);
        return next;
      });
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
          <ul className="mt-6 space-y-3">
            {orderedResponses.map((response, index) => {
              const rid = response.id ?? `${response.hotelName}-${index}`;
              const isOpen = openIds.has(rid);
              const isEditing = editingId === response.id;
              const hasCustomText = response.offerText && response.offerText !== response.message;
              const associatedHotel = response.hotelId ? hotelsById.get(response.hotelId) : null;
              const isSavingAssociation = response.id
                ? savingAssociationIds.has(response.id)
                : false;

              return (
                <li
                  key={rid}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center">
                    {/* Header — always visible, clickable */}
                    <button
                      type="button"
                      onClick={() => toggleOpen(rid)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      >
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {response.hotelName}
                      </span>
                      {response.respondentName && (
                        <span className="truncate text-sm text-slate-500">
                          • {response.respondentName}
                        </span>
                      )}
                      {hasCustomText && (
                        <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                          Personnalisé
                        </span>
                      )}
                      {response.createdAt && (
                        <span className="ml-auto hidden shrink-0 text-xs text-slate-400 md:inline">
                          {formatDateTime(response.createdAt)}
                        </span>
                      )}
                    </button>
                    <select
                      value={response.hotelId ?? ""}
                      onChange={(event) => {
                        void handleAssociationChange(response, event.target.value);
                      }}
                      disabled={
                        !onUpdateResponse ||
                        !response.id ||
                        isBusy ||
                        isSavingAssociation
                      }
                      className={`w-full rounded-full border px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:max-w-[260px] ${
                        associatedHotel
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                      aria-label={`Hôtel associé à ${response.hotelName}`}
                    >
                      <option value="">Non associé</option>
                      {response.hotelId && !associatedHotel && (
                        <option value={response.hotelId}>Hôtel introuvable</option>
                      )}
                      {sortedHotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.destination ? `${hotel.destination} - ` : ""}
                          {hotel.nom}
                          {hotel.ppt_tag ? ` (${hotel.ppt_tag})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Collapsible content */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                      {/* Réponse originale de l'hôtel */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Réponse de l&apos;hôtel
                        </p>
                        <p className="mt-1 whitespace-pre-line rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {response.message}
                        </p>
                      </div>

                      {/* Texte pour l'offre (éditable) */}
                      {isEditing ? (
                        <ResponseEditForm
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
                          onDeleteResponse={!!onDeleteResponse}
                        />
                      ) : (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                            Texte pour l&apos;offre
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
                    </div>
                  )}
                </li>
              );
            })}
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
