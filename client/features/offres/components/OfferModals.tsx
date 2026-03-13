"use client";

import { useState } from "react";

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "En cours..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DuplicateModal({
  count,
  loading,
  onCancel,
  onConfirm,
}: {
  count: number;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (opts: { includeAttachments: boolean; includeHotelData: boolean }) => void;
}) {
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [includeHotelData, setIncludeHotelData] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Dupliquer les offres</h3>
        <p className="mt-2 text-sm text-slate-600">
          {count} offre{count > 1 ? "s" : ""} sera{count > 1 ? "ont" : ""} dupliquée{count > 1 ? "s" : ""}. Que souhaitez-vous inclure ?
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={includeAttachments}
              onChange={(e) => setIncludeAttachments(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Annexes</p>
              <p className="text-xs text-slate-500">Copier les fichiers attachés à l'offre</p>
            </div>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={includeHotelData}
              onChange={(e) => setIncludeHotelData(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Réponses et envois hôtels</p>
              <p className="text-xs text-slate-500">Copier les réponses hôtelières et les envois effectués</p>
            </div>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ includeAttachments, includeHotelData })}
            disabled={loading}
            className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {loading ? "Duplication..." : "Dupliquer"}
          </button>
        </div>
      </div>
    </div>
  );
}
