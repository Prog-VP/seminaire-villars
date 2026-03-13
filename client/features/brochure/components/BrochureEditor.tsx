"use client";

import type { BrochureSection } from "../types";
import { destinationLabel } from "../utils";
import { SECTION_TYPE_LABELS, ADD_SECTION_OPTIONS } from "./brochure-editor-constants";
import { SectionEditor } from "./BrochureSectionEditor";
import { useBrochureEditor } from "./useBrochureEditor";

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
  const {
    sections,
    selectedIdx,
    setSelectedIdx,
    linkCopied,
    hasChanges,
    showAddMenu,
    setShowAddMenu,
    selected,
    updateSection,
    updateSectionMetadata,
    handleSave,
    handleCopyLink,
    handleReset,
    moveSection,
    addSection,
    deleteSection,
  } = useBrochureEditor({
    initialSections,
    onSave,
    onCopyLink,
    onReset,
  });

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
