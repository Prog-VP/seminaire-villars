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
              onSave={(label, color) => editValue(item.id, type, label, color)}
              onDelete={() => removeValue(item.id, type)}
            />
          ))
        )}
      </ul>
    </section>
  );
}

const PRESET_COLORS = [
  { label: "Gris", bg: "bg-slate-100", text: "text-slate-700", value: "slate" },
  { label: "Bleu", bg: "bg-blue-100", text: "text-blue-700", value: "blue" },
  { label: "Rose", bg: "bg-rose-100", text: "text-rose-700", value: "rose" },
  { label: "Vert", bg: "bg-emerald-100", text: "text-emerald-700", value: "emerald" },
  { label: "Orange", bg: "bg-amber-100", text: "text-amber-700", value: "amber" },
  { label: "Violet", bg: "bg-purple-100", text: "text-purple-700", value: "purple" },
  { label: "Cyan", bg: "bg-cyan-100", text: "text-cyan-700", value: "cyan" },
  { label: "Rose vif", bg: "bg-pink-100", text: "text-pink-700", value: "pink" },
];

function SettingListItem({
  item,
  type,
  onSave,
  onDelete,
}: {
  item: SettingValue;
  type: SettingType;
  onSave: (label: string, color?: string | null) => Promise<SettingValue>;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(item.label);
  const [color, setColor] = useState(item.color ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const showColor = type === "statut";

  useEffect(() => {
    setValue(item.label);
    setColor(item.color ?? "");
  }, [item.label, item.color]);

  const handleSave = async () => {
    if (!value.trim()) {
      setError("Le libellé ne peut pas être vide.");
      return;
    }
    try {
      setStatus("saving");
      setError(null);
      await onSave(value.trim(), showColor ? (color || null) : undefined);
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

  const currentPreset = PRESET_COLORS.find((c) => c.value === (item.color ?? "slate")) ?? PRESET_COLORS[0];

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      {showColor && !isEditing && (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${currentPreset.bg} ${currentPreset.text}`}>
          {item.label}
        </span>
      )}
      {isEditing ? (
        <div className="flex-1 min-w-[180px] space-y-2">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={status === "saving"}
          />
          {showColor && (
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${c.bg} ${c.text} ${
                    color === c.value ? "ring-2 ring-slate-400 ring-offset-1" : ""
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        !showColor && <p className="text-sm font-medium text-slate-800">{item.label}</p>
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
                setColor(item.color ?? "");
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

