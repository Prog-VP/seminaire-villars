"use client";

import { useState, useEffect } from "react";
import type { SettingType, SettingValue } from "../types";
import { useSettings } from "../context";
import { IconButton } from "@/components/ui/IconButton";

type EditableSettingsListProps = {
  type: SettingType;
  title: string;
  description: string;
  placeholder?: string;
};

export function EditableSettingsList({
  type,
  title,
  description,
  placeholder,
}: EditableSettingsListProps) {
  const { settings, addValue, editValue, removeValue } = useSettings();
  const [newValue, setNewValue] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newValue.trim()) {
      setCreateError("Veuillez saisir un libellé.");
      return;
    }
    try {
      setIsCreating(true);
      setCreateError(null);
      await addValue(type, newValue.trim());
      setNewValue("");
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter ce libellé."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const items = settings[type];

  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
      <header className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </header>

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleCreate}>
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder={placeholder}
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          disabled={isCreating}
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isCreating}
        >
          {isCreating ? "Ajout..." : "Ajouter"}
        </button>
      </form>
      {createError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {createError}
        </p>
      )}

      <ul className="mt-4 divide-y divide-slate-100">
        {items.length === 0 ? (
          <li className="py-5 text-center text-sm text-slate-500">
            Aucun libellé enregistré pour l&apos;instant.
          </li>
        ) : (
          items.map((item) => (
            <SettingListItem
              key={item.id}
              item={item}
              type={type}
              onSave={(label) => editValue(item.id, type, label)}
              onDelete={() => removeValue(item.id, type)}
            />
          ))
        )}
      </ul>
    </section>
  );
}

function SettingListItem({
  item,
  type,
  onSave,
  onDelete,
}: {
  item: SettingValue;
  type: SettingType;
  onSave: (label: string) => Promise<SettingValue>;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(item.label);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");

  useEffect(() => {
    setValue(item.label);
  }, [item.label]);

  const handleSave = async () => {
    if (!value.trim()) {
      setError("Le libellé ne peut pas être vide.");
      return;
    }
    try {
      setStatus("saving");
      setError(null);
      await onSave(value.trim());
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer ce libellé."
      );
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async () => {
    const confirmation = window.confirm(
      `Supprimer "${item.label}" de la liste "${type}" ?`
    );
    if (!confirmation) return;
    try {
      setStatus("deleting");
      await onDelete();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer ce libellé."
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      {isEditing ? (
        <input
          className="flex-1 min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={status === "saving"}
        />
      ) : (
        <p className="text-sm font-medium text-slate-800">{item.label}</p>
      )}
      <div className="ml-auto flex items-center gap-1">
        {isEditing ? (
          <>
            <IconButton
              label="Enregistrer"
              icon="check"
              onClick={handleSave}
              disabled={status === "saving"}
            />
            <IconButton
              label="Annuler"
              icon="close"
              onClick={() => {
                setIsEditing(false);
                setValue(item.label);
                setError(null);
              }}
              disabled={status === "saving"}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {error && (
        <p className="ml-auto text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

