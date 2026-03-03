"use client";

import { useCallback, useState } from "react";
import type { BrochureSection, BrochureSectionType, ConferenceRoom, Activity, SkiPrice } from "../types";
import { brochureImageUrl, destinationLabel } from "../utils";

type Props = {
  sections: BrochureSection[];
  destination: string;
  lang: string;
  onSave: (sections: BrochureSection[]) => Promise<void>;
  onPreview: () => void;
  onCopyLink?: () => void;
  onReset?: () => void;
  isSaving?: boolean;
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  welcome: "Accueil",
  hotel: "Hôtel",
  venue: "Lieu",
  "activities-summer": "Activités été",
  "activities-winter": "Activités hiver",
  ski: "Domaine skiable",
  contacts: "Contacts",
  custom: "Section libre",
};

const ADD_SECTION_OPTIONS: { type: BrochureSectionType; label: string; icon: string }[] = [
  { type: "custom", label: "Section libre (texte)", icon: "T" },
  { type: "welcome", label: "Accueil / Hero", icon: "H" },
  { type: "hotel", label: "Hôtel", icon: "🏨" },
  { type: "venue", label: "Lieu / Salle", icon: "📍" },
  { type: "activities-summer", label: "Activités été", icon: "☀" },
  { type: "activities-winter", label: "Activités hiver", icon: "❄" },
  { type: "ski", label: "Domaine skiable", icon: "⛷" },
  { type: "contacts", label: "Contacts", icon: "📞" },
];

export function BrochureEditor({
  sections: initialSections,
  destination,
  lang,
  onSave,
  onPreview,
  onCopyLink,
  onReset,
  isSaving,
}: Props) {
  const [sections, setSections] = useState<BrochureSection[]>(initialSections);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSection = useCallback(
    (idx: number, patch: Partial<BrochureSection>) => {
      setSections((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      });
      setHasChanges(true);
    },
    []
  );

  const updateSectionMetadata = useCallback(
    (idx: number, metaPatch: Record<string, unknown>) => {
      setSections((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          metadata: { ...next[idx].metadata, ...metaPatch },
        };
        return next;
      });
      setHasChanges(true);
    },
    []
  );

  const handleSave = async () => {
    await onSave(sections);
    setHasChanges(false);
  };

  const handleCopyLink = () => {
    onCopyLink?.();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Réinitialiser la brochure depuis le modèle de base ? Toutes les modifications seront perdues."
      )
    ) {
      onReset?.();
    }
  };

  const moveSection = (fromIdx: number, direction: "up" | "down") => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
    setSelectedIdx(toIdx);
    setHasChanges(true);
  };

  const addSection = (type: BrochureSectionType) => {
    const id = `${type}-${Date.now()}`;
    const newSection: BrochureSection = {
      id,
      type,
      enabled: true,
      title: SECTION_TYPE_LABELS[type] ?? "Nouvelle section",
      content: "",
      images: [],
      metadata:
        type === "hotel"
          ? { conferenceRooms: [] }
          : type === "activities-summer" || type === "activities-winter"
            ? { activities: [] }
            : type === "ski"
              ? { skiPrices: [] }
              : undefined,
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedIdx(sections.length); // select the newly added one
    setHasChanges(true);
  };

  const deleteSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx((prev) => (prev >= idx && prev > 0 ? prev - 1 : prev));
    setHasChanges(true);
  };

  const [showAddMenu, setShowAddMenu] = useState(false);

  const selected = sections[selectedIdx];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Brochure — {destinationLabel(destination)}
          </h3>
          <p className="text-xs text-slate-500">
            Langue : {lang === "fr" ? "Français" : lang === "en" ? "English" : "Deutsch"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onReset && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Réinitialiser
            </button>
          )}
          {onCopyLink && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {linkCopied ? "Copié !" : "Copier le lien"}
            </button>
          )}
          <button
            type="button"
            onClick={onPreview}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-900 transition hover:bg-brand-100"
          >
            Aperçu
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-3 py-1.5 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left: section list */}
        <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sections ({sections.filter((s) => s.enabled).length}/{sections.length})
          </p>
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition cursor-pointer ${
                idx === selectedIdx
                  ? "bg-brand-50 ring-1 ring-brand-200"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => setSelectedIdx(idx)}
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateSection(idx, { enabled: !section.enabled });
                }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${
                  section.enabled
                    ? "bg-brand-900 text-white"
                    : "border border-slate-300 bg-white text-slate-300"
                }`}
                title={section.enabled ? "Désactiver" : "Activer"}
              >
                {section.enabled && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    section.enabled ? "text-slate-900" : "text-slate-400 line-through"
                  }`}
                >
                  {section.title || section.id}
                </p>
                <p className="text-[10px] text-slate-400">
                  {SECTION_TYPE_LABELS[section.type] ?? section.type}
                </p>
              </div>

              {/* Move / Delete buttons */}
              <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(idx, "up");
                  }}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Monter"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(idx, "down");
                  }}
                  disabled={idx === sections.length - 1}
                  className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Descendre"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Supprimer la section « ${section.title || section.id} » ?`)) {
                      deleteSection(idx);
                    }
                  }}
                  className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                  title="Supprimer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Add section button */}
          <div className="relative mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddMenu((p) => !p)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Ajouter une section
            </button>
            {showAddMenu && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {ADD_SECTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      addSection(opt.type);
                      setShowAddMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="text-slate-400">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: section editor */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {selected ? (
            <SectionEditor
              section={selected}
              onChange={(patch) => updateSection(selectedIdx, patch)}
              onMetadataChange={(patch) =>
                updateSectionMetadata(selectedIdx, patch)
              }
            />
          ) : (
            <p className="text-center text-sm text-slate-400">
              Sélectionnez une section à modifier.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section editor (right panel)
// ---------------------------------------------------------------------------

function SectionEditor({
  section,
  onChange,
  onMetadataChange,
}: {
  section: BrochureSection;
  onChange: (patch: Partial<BrochureSection>) => void;
  onMetadataChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {SECTION_TYPE_LABELS[section.type] ?? section.type}
        </span>
        <span className="text-xs text-slate-400">ID: {section.id}</span>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Titre
        </label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
        />
      </div>

      {/* Content */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Contenu
        </label>
        <textarea
          value={section.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={8}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
        />
      </div>

      {/* Images (read-only display) */}
      {section.images && section.images.length > 0 && (
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Images ({section.images.length})
          </label>
          <div className="grid grid-cols-3 gap-2">
            {section.images.map((img, i) => (
              <div key={i} className="group relative">
                <img
                  src={brochureImageUrl(img)}
                  alt={`Image ${i + 1}`}
                  className="h-20 w-full rounded-lg border border-slate-200 object-cover"
                />
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {img.split("/").pop()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotel response data (read-only) */}
      {section.type === "hotel" && section.metadata?.hotelResponseData && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Données dynamiques (réponse hôtel)
          </h4>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(section.metadata.hotelResponseData).map(
              ([key, val]) =>
                val ? (
                  <div key={key}>
                    <span className="text-blue-600">{key}: </span>
                    <span className="font-medium text-slate-900">{val}</span>
                  </div>
                ) : null
            )}
          </div>
        </div>
      )}

      {/* Conference rooms table editor */}
      {section.metadata?.conferenceRooms && (
        <ConferenceRoomsEditor
          rooms={section.metadata.conferenceRooms}
          onChange={(rooms) => onMetadataChange({ conferenceRooms: rooms })}
        />
      )}

      {/* Activities editor */}
      {section.metadata?.activities && (
        <ActivitiesEditor
          activities={section.metadata.activities}
          onChange={(activities) => onMetadataChange({ activities })}
        />
      )}

      {/* Ski prices editor */}
      {section.metadata?.skiPrices && (
        <SkiPricesEditor
          prices={section.metadata.skiPrices}
          onChange={(skiPrices) => onMetadataChange({ skiPrices })}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline table editors
// ---------------------------------------------------------------------------

function ConferenceRoomsEditor({
  rooms,
  onChange,
}: {
  rooms: ConferenceRoom[];
  onChange: (rooms: ConferenceRoom[]) => void;
}) {
  const update = (idx: number, field: keyof ConferenceRoom, value: string | number) => {
    const next = [...rooms];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Salles de conférence
      </label>
      <div className="overflow-x-auto text-xs">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-1 py-1">Salle</th>
              <th className="px-1 py-1">m²</th>
              <th className="px-1 py-1">Haut.</th>
              <th className="px-1 py-1">Th.</th>
              <th className="px-1 py-1">Sém.</th>
              <th className="px-1 py-1">U</th>
              <th className="px-1 py-1">Banq.</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-1 py-1">
                  <input
                    value={room.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    className="w-20 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={room.m2}
                    onChange={(e) => update(i, "m2", e.target.value)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={room.height}
                    onChange={(e) => update(i, "height", e.target.value)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.theatre}
                    onChange={(e) => update(i, "theatre", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.seminar}
                    onChange={(e) => update(i, "seminar", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.uShape}
                    onChange={(e) => update(i, "uShape", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.banquet}
                    onChange={(e) => update(i, "banquet", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivitiesEditor({
  activities,
  onChange,
}: {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
}) {
  const update = (idx: number, field: keyof Activity, value: string) => {
    const next = [...activities];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Activités
      </label>
      <div className="space-y-2">
        {activities.map((a, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              value={a.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Nom"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={a.description}
              onChange={(e) => update(i, "description", e.target.value)}
              placeholder="Description"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={a.price}
              onChange={(e) => update(i, "price", e.target.value)}
              placeholder="Prix"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkiPricesEditor({
  prices,
  onChange,
}: {
  prices: SkiPrice[];
  onChange: (prices: SkiPrice[]) => void;
}) {
  const update = (idx: number, field: keyof SkiPrice, value: string) => {
    const next = [...prices];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Tarifs ski
      </label>
      <div className="space-y-2">
        {prices.map((p, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              value={p.period}
              onChange={(e) => update(i, "period", e.target.value)}
              placeholder="Période"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={p.skipass}
              onChange={(e) => update(i, "skipass", e.target.value)}
              placeholder="Forfait"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={p.rental}
              onChange={(e) => update(i, "rental", e.target.value)}
              placeholder="Location"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
