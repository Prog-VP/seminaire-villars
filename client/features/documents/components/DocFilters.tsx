"use client";

import { DEST_LABELS, SEASON_LABELS, LANG_LABELS } from "./generate-doc-constants";

type DocFiltersProps = {
  destinations: string[];
  seasons: string[];
  langs: string[];
  filterDest: string;
  setFilterDest: (v: string) => void;
  filterSeason: string;
  setFilterSeason: (v: string) => void;
  filterLang: string;
  setFilterLang: (v: string) => void;
};

export function DocFilters({
  destinations,
  seasons,
  langs,
  filterDest,
  setFilterDest,
  filterSeason,
  setFilterSeason,
  filterLang,
  setFilterLang,
}: DocFiltersProps) {
  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-4 shadow-sm ring-1 ring-white/60">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filtres
        </span>

        <div className="flex items-center gap-1.5">
          <select
            value={filterDest}
            onChange={(e) => setFilterDest(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Toutes destinations</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                {DEST_LABELS[d] ?? d}
              </option>
            ))}
          </select>
          {filterDest && (
            <button type="button" onClick={() => setFilterDest("")} className="text-xs text-slate-400 hover:text-slate-600">
              Tous
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Toutes saisons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {SEASON_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          {filterSeason && (
            <button type="button" onClick={() => setFilterSeason("")} className="text-xs text-slate-400 hover:text-slate-600">
              Tous
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Toutes langues</option>
            {langs.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l] ?? l}
              </option>
            ))}
          </select>
          {filterLang && (
            <button type="button" onClick={() => setFilterLang("")} className="text-xs text-slate-400 hover:text-slate-600">
              Tous
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
