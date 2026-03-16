"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentBlock } from "../types";
import {
  fetchDocumentBlocks,
  createDocumentBlock,
  updateDocumentBlock,
  deleteDocumentBlock,
  downloadDocumentBlock,
} from "../api";
import { downloadBlob } from "@/lib/download";

const DESTINATIONS = [
  { value: "villars", label: "Villars-sur-Ollon" },
  { value: "diablerets", label: "Les Diablerets" },
];

const SEASONS = [
  { value: "ete", label: "Été" },
  { value: "hiver", label: "Hiver" },
];

const LANGS = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "de", label: "DE" },
];

const DEST_LABELS: Record<string, string> = {
  villars: "Villars-sur-Ollon",
  diablerets: "Les Diablerets",
};

const SEASON_LABELS: Record<string, string> = {
  ete: "Été",
  hiver: "Hiver",
};

function seasonDisplay(season: string): string {
  return season
    .split(",")
    .map((s) => SEASON_LABELS[s.trim()] ?? s.trim())
    .join(", ");
}

export function DocumentBlocksPage() {
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDocumentBlocks();
      setBlocks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les documents."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (
    destination: string,
    season: string,
    lang: string,
    name: string,
    file: File
  ) => {
    const created = await createDocumentBlock(destination, season, lang, name, file);
    setBlocks((prev) => [...prev, created]);
  };

  const handleRename = async (block: DocumentBlock, newName: string) => {
    const updated = await updateDocumentBlock(block.id, { name: newName });
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? updated : b)));
  };

  const handleSeasonChange = async (block: DocumentBlock, newSeason: string) => {
    const updated = await updateDocumentBlock(block.id, { season: newSeason });
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? updated : b)));
  };

  const handleDelete = async (block: DocumentBlock) => {
    const confirmed = window.confirm(`Supprimer le bloc « ${block.name} » ?`);
    if (!confirmed) return;
    await deleteDocumentBlock(block.id, block.filePath);
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
  };

  const handleDownload = async (block: DocumentBlock) => {
    const blob = await downloadDocumentBlock(block.filePath);
    downloadBlob(blob, block.filePath.split("/").pop() ?? "document.docx");
  };

  // Filters
  const [filterDest, setFilterDest] = useState<string>("");
  const [filterSeason, setFilterSeason] = useState<string>("");
  const [filterLang, setFilterLang] = useState<string>("");

  const filtered = blocks.filter((b) => {
    if (filterDest && b.destination !== filterDest) return false;
    if (filterSeason && !b.season.split(",").map((s) => s.trim()).includes(filterSeason)) return false;
    if (filterLang && b.lang !== filterLang) return false;
    return true;
  });

  // Group filtered blocks by destination
  const grouped = filtered.reduce<Record<string, DocumentBlock[]>>((acc, block) => {
    const key = block.destination;
    if (!acc[key]) acc[key] = [];
    acc[key].push(block);
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      <CreateBlockForm onCreate={handleCreate} />

      {/* Filters */}
      {blocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Filtrer :</span>
          <select
            value={filterDest}
            onChange={(e) => setFilterDest(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="">Toutes destinations</option>
            {DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="">Toutes saisons</option>
            {SEASONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="">Toutes langues</option>
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          {(filterDest || filterSeason || filterLang) && (
            <button
              type="button"
              onClick={() => { setFilterDest(""); setFilterSeason(""); setFilterLang(""); }}
              className="text-xs text-slate-500 underline hover:text-slate-700"
            >
              Effacer
            </button>
          )}
          <span className="text-xs text-slate-400">{filtered.length} / {blocks.length}</span>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chargement…
        </div>
      ) : blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun bloc document pour l&apos;instant.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun bloc ne correspond aux filtres.
        </div>
      ) : (
        Object.entries(grouped).map(([dest, destBlocks]) => (
          <div key={dest} className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">
              {DEST_LABELS[dest] ?? dest}
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Nom
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Saison
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Langue
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {destBlocks.map((block) => (
                    <BlockRow
                      key={block.id}
                      block={block}
                      onRename={handleRename}
                      onSeasonChange={handleSeasonChange}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Block row with inline rename + season edit                          */
/* ------------------------------------------------------------------ */

function BlockRow({
  block,
  onRename,
  onSeasonChange,
  onDownload,
  onDelete,
}: {
  block: DocumentBlock;
  onRename: (block: DocumentBlock, name: string) => Promise<void>;
  onSeasonChange: (block: DocumentBlock, season: string) => Promise<void>;
  onDownload: (block: DocumentBlock) => Promise<void>;
  onDelete: (block: DocumentBlock) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(block.name);
  const [saving, setSaving] = useState(false);

  const currentSeasons = new Set(block.season.split(",").map((s) => s.trim()).filter(Boolean));

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === block.name) {
      setEditing(false);
      setEditName(block.name);
      return;
    }
    setSaving(true);
    try {
      await onRename(block, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleSeason = async (value: string) => {
    const next = new Set(currentSeasons);
    if (next.has(value)) {
      if (next.size <= 1) return; // au moins une saison
      next.delete(value);
    } else {
      next.add(value);
    }
    await onSeasonChange(block, Array.from(next).join(","));
  };

  return (
    <tr className="group">
      <td className="px-5 py-3.5">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveName();
                if (e.key === "Escape") { setEditing(false); setEditName(block.name); }
              }}
              autoFocus
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => void handleSaveName()}
              disabled={saving}
              className="rounded bg-brand-900 px-2 py-1 text-xs text-white hover:bg-brand-800 disabled:opacity-50"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setEditName(block.name); }}
              className="rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
            title="Cliquer pour renommer"
          >
            {block.name}
          </button>
        )}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex gap-1">
          {SEASONS.map((s) => {
            const isOn = currentSeasons.has(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => void toggleSeason(s.value)}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                  isOn
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {block.lang}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => void onDownload(block)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            title="Télécharger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void onDelete(block)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
            title="Supprimer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M6 7h12" strokeLinecap="round" />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" />
              <path d="M8 7V5h8v2" />
              <path d="M7 7h10v11a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline create form                                                 */
/* ------------------------------------------------------------------ */

function CreateBlockForm({
  onCreate,
}: {
  onCreate: (
    destination: string,
    season: string,
    lang: string,
    name: string,
    file: File
  ) => Promise<void>;
}) {
  const [destination, setDestination] = useState("villars");
  const [selectedSeasons, setSelectedSeasons] = useState<Set<string>>(new Set(["hiver"]));
  const [lang, setLang] = useState("fr");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const toggleSeason = (value: string) => {
    setSelectedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        if (next.size <= 1) return prev; // au moins une
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Veuillez saisir un nom.");
      return;
    }
    if (!file) {
      setError("Veuillez sélectionner un fichier Word.");
      return;
    }
    if (selectedSeasons.size === 0) {
      setError("Veuillez sélectionner au moins une saison.");
      return;
    }
    try {
      setIsCreating(true);
      setError(null);
      const season = Array.from(selectedSeasons).join(",");
      await onCreate(destination, season, lang, name.trim(), file);
      setName("");
      setFile(null);
      const input = document.getElementById("block-file-input") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'ajouter ce document."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
      <header className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-slate-900">
          Ajouter un bloc document
        </p>
      </header>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isCreating}
          >
            {DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {SEASONS.map((s) => {
              const isOn = selectedSeasons.has(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSeason(s.value)}
                  disabled={isCreating}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isOn
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                  } disabled:opacity-50`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={isCreating}
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="Nom du bloc (ex: Page de garde)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
          />
          <input
            id="block-file-input"
            type="file"
            accept=".docx,.doc"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-700"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={isCreating}
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isCreating}
          >
            {isCreating ? "Ajout…" : "Ajouter"}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
