"use client";

type SelectionActionBarProps = {
  count: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeselect: () => void;
};

export function SelectionActionBar({
  count,
  onDuplicate,
  onDelete,
  onDeselect,
}: SelectionActionBarProps) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 shadow-sm">
      <span className="text-sm font-medium text-brand-900">
        {count} offre{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""}
      </span>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Dupliquer
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
        >
          Supprimer
        </button>
        <button
          type="button"
          onClick={onDeselect}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          Désélectionner
        </button>
      </div>
    </div>
  );
}
