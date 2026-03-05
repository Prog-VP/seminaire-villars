"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentBlock } from "../types";
import {
  fetchDocumentBlocks,
  createDocumentBlock,
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

  // Group blocks by destination
  const grouped = blocks.reduce<Record<string, DocumentBlock[]>>((acc, block) => {
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

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chargement…
        </div>
      ) : blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun bloc document pour l&apos;instant.
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
                    <tr key={block.id} className="group">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {block.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {SEASON_LABELS[block.season] ?? block.season}
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
                            onClick={() => handleDownload(block)}
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
                            onClick={() => handleDelete(block)}
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
  const [season, setSeason] = useState("hiver");
  const [lang, setLang] = useState("fr");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
    try {
      setIsCreating(true);
      setError(null);
      await onCreate(destination, season, lang, name.trim(), file);
      setName("");
      setFile(null);
      // Reset file input
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
        <div className="flex flex-col gap-2 sm:flex-row">
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
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            disabled={isCreating}
          >
            {SEASONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
