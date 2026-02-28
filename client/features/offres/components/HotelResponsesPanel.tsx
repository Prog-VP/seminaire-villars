"use client";

import { useMemo, useState } from "react";
import type { HotelResponse } from "../types";

type HotelResponsesPanelProps = {
  responses?: HotelResponse[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onUpdateResponse?: (
    responseId: string,
    payload: { hotelName: string; respondentName?: string; message: string }
  ) => Promise<void>;
  onDeleteResponse?: (responseId: string) => Promise<void>;
  isBusy?: boolean;
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

export function HotelResponsesPanel({
  responses = [],
  onRefresh,
  isRefreshing,
  onUpdateResponse,
  onDeleteResponse,
  isBusy,
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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Réponses hôtels
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {responses.length > 0
              ? `${responses.length} intervention${responses.length > 1 ? "s" : ""}`
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
          Partagez cette offre avec un hôtel pour collecter ses disponibilités et conditions.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orderedResponses.map((response, index) => (
            <li
              key={`${response.hotelName}-${response.createdAt ?? index}`}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
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
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                {response.message}
              </p>
              {onUpdateResponse && response.id && editingId !== response.id && (
                <button
                  type="button"
                  onClick={() => handleEditClick(response)}
                  className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
                >
                  Modifier
                </button>
              )}
              {editingId === response.id && (
                <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
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
                    Message
                    <textarea
                      name="message"
                      value={editForm.message}
                      onChange={handleEditChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      rows={4}
                    />
                  </label>
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
                      onClick={handleCancel}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Annuler
                    </button>
                    {onDeleteResponse && editingId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(editingId)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
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
  );
}
