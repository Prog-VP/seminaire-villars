"use client";

import { useState } from "react";
import type { DashboardEntity } from "@/types/entities";

type EditableDetailCardProps<T extends DashboardEntity> = {
  entityLabel: string;
  item?: T;
};

export function EditableDetailCard<T extends DashboardEntity>({
  entityLabel,
  item,
}: EditableDetailCardProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [savedNom, setSavedNom] = useState(item?.nom ?? "");
  const [savedDescription, setSavedDescription] = useState(
    item?.description ?? ""
  );
  const [nomInput, setNomInput] = useState(savedNom);
  const [descriptionInput, setDescriptionInput] = useState(savedDescription);

  const startEdit = () => {
    setNomInput(savedNom);
    setDescriptionInput(savedDescription);
    setIsEditing(true);
  };

  if (!item) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Non trouvé.
      </div>
    );
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavedNom(nomInput.trim());
    setSavedDescription(descriptionInput.trim());
    setIsEditing(false);
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {entityLabel}
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {savedNom}
          </h2>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Modifier
          </button>
        )}
      </div>

      <div className="pt-6">
        {isEditing ? (
          <form className="space-y-4" onSubmit={handleSave}>
            <label className="block text-sm font-medium text-slate-700">
              Nom
              <input
                value={nomInput}
                onChange={(event) => setNomInput(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => {
                  setNomInput(savedNom);
                  setDescriptionInput(savedDescription);
                  setIsEditing(false);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <dl className="space-y-6">
            <div>
              <dt className="text-sm font-semibold text-slate-500">Nom</dt>
              <dd className="text-base text-slate-900">{savedNom}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Description
              </dt>
              <dd className="text-base text-slate-700">{savedDescription}</dd>
            </div>
          </dl>
        )}
      </div>
    </article>
  );
}
