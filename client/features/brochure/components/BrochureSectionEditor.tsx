"use client";

import type { BrochureSection } from "../types";
import { brochureImageUrl } from "../utils";
import { SECTION_TYPE_LABELS } from "./brochure-editor-constants";
import { ConferenceRoomsEditor, ActivitiesEditor, SkiPricesEditor } from "./BrochureMetadataEditors";

export function SectionEditor({
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
