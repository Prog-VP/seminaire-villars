"use client";

import type { HotelResponse } from "../types";

export type ResponseEditFormState = {
  hotelName: string;
  respondentName: string;
  message: string;
  offerText: string;
};

type ResponseEditFormProps = {
  response: HotelResponse;
  editForm: ResponseEditFormState;
  onEditChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSave: () => void;
  onCancel: () => void;
  onResetOfferText: () => void;
  onDelete?: (responseId: string) => void;
  editingId: string;
  isSaving: boolean;
  isBusy?: boolean;
  onUpdateResponse?: boolean;
  onDeleteResponse?: boolean;
};

export function ResponseEditForm({
  editForm,
  onEditChange,
  onSave,
  onCancel,
  onResetOfferText,
  onDelete,
  editingId,
  isSaving,
  isBusy,
  onDeleteResponse,
}: ResponseEditFormProps) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-brand-200 bg-brand-50/30 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Nom de l&apos;hôtel
          <input
            name="hotelName"
            value={editForm.hotelName}
            onChange={onEditChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Contact
          <input
            name="respondentName"
            value={editForm.respondentName}
            onChange={onEditChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
      </div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Texte pour l&apos;offre
        <textarea
          name="offerText"
          value={editForm.offerText}
          onChange={onEditChange}
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
          onClick={onSave}
          disabled={isSaving || isBusy}
          className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onResetOfferText}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          title="Réinitialiser le texte offre avec la réponse originale"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Annuler
        </button>
        {onDeleteResponse && onDelete && editingId && (
          <button
            type="button"
            onClick={() => onDelete(editingId)}
            className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
