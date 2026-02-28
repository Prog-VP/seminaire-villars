"use client";

import { useState, useEffect } from "react";
import type { SettingType, SettingValue } from "../types";
import { useSettings } from "../context";

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

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  icon: "edit" | "trash" | "check" | "close";
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50";
  const danger =
    "border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-100";
  const defaultTone = "border-slate-200 hover:text-slate-900";
  return (
    <button
      type="button"
      className={`${base} ${tone === "danger" ? danger : defaultTone}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {renderIcon(icon)}
    </button>
  );
}

function renderIcon(name: "edit" | "trash" | "check" | "close") {
  switch (name) {
    case "edit":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M15.232 5.232l3.536 3.536" />
          <path d="M4 20l4.243-.707 11.314-11.314-3.536-3.536L4.707 15.757 4 20z" />
        </svg>
      );
    case "trash":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M6 7h12" strokeLinecap="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          <path d="M8 7V5h8v2" />
          <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "check":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "close":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
