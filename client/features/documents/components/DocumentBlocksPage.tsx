"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentBlock } from "../types";
import {
  deleteMasterPowerPoint,
  downloadMasterPowerPoint,
  fetchMasterPowerPoint,
  uploadMasterPowerPoint,
} from "../api";
import { downloadBlob } from "@/lib/download";

export function DocumentBlocksPage() {
  const [master, setMaster] = useState<DocumentBlock | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMaster(await fetchMasterPowerPoint());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger le document MASTER.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier PowerPoint.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const uploaded = await uploadMasterPowerPoint(selectedFile);
      setMaster(uploaded);
      setSelectedFile(null);
      const input = document.getElementById("master-powerpoint-input") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le document MASTER.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!master) return;
    try {
      setError(null);
      const blob = await downloadMasterPowerPoint();
      downloadBlob(blob, master.name || "MASTER.pptx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de télécharger le document MASTER.");
    }
  };

  const handleDelete = async () => {
    if (!master || isDeleting) return;
    const confirmed = window.confirm("Supprimer le PowerPoint MASTER ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteMasterPowerPoint();
      setMaster(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le document MASTER.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">PowerPoint MASTER</p>
          {isLoading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : master ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">{master.name}</p>
              <p className="text-xs text-slate-400">
                Dernier fichier enregistré le {new Date(master.createdAt).toLocaleDateString("fr-CH")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucun PowerPoint MASTER n&apos;est enregistré.</p>
          )}
        </div>

        {master && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Télécharger
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        )}
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleUpload}>
        <input
          id="master-powerpoint-input"
          type="file"
          accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-700"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          disabled={isSaving}
        />
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Enregistrement..." : master ? "Remplacer" : "Enregistrer"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Aide-mémoire tags PowerPoint
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Ajoutez les tags dans les notes du présentateur de chaque slide.
        </p>
        <pre
          suppressHydrationWarning
          className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs leading-relaxed text-slate-700"
        >
{`#TAGS
LANG:FR
DEST:VILLARS
SEASON:ETE
SECTION:INTRO
#END`}
        </pre>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Exemple slide hôtel
        </p>
        <pre
          suppressHydrationWarning
          className="mt-2 overflow-x-auto rounded-md bg-white p-3 text-xs leading-relaxed text-slate-700"
        >
{`#TAGS
LANG:FR
DEST:VILLARS
SEASON:ALL
SECTION:HOTELS
HOTEL:AUBERGE_POSTE
#END`}
        </pre>
        <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
          <p><span className="font-semibold text-slate-700">LANG</span> : FR, EN, DE</p>
          <p><span className="font-semibold text-slate-700">DEST</span> : VILLARS, DIABLERETS, ALL</p>
          <p><span className="font-semibold text-slate-700">SEASON</span> : ETE, HIVER, ALL</p>
          <p><span className="font-semibold text-slate-700">SECTION</span> : TITRE, MAP, SOMMAIRE, INTRO, HOTELS, ACTIVITES, DOMAINE_SKIABLE, CONTACT</p>
          <p><span className="font-semibold text-slate-700">HOTEL</span> : tag exact de la colonne Tag PPT</p>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Placeholders remplacés dans les slides
        </p>
        <pre
          suppressHydrationWarning
          className="mt-2 overflow-x-auto rounded-md bg-white p-3 text-xs leading-relaxed text-slate-700"
        >
{`{{SOCIETE}}
{{MOIS_ANNEE}}
{{PARTICIPANTS}}
{{CONTACT}}
{{PRENOM_CONTACT}}
{{NOM_CONTACT}}
{{EMAIL_CONTACT}}
{{TELEPHONE_CONTACT}}
{{DATES}}
{{TYPE_SEJOUR}}
{{HOTEL}}
{{TEXTE_OFFRE}}

Sommaire :
{{PAGE_MAP}}
{{PAGE_SOMMAIRE}}
{{PAGE_VILLARS}}
{{PAGE_VILLARS_HOTELS}}
{{PAGE_VILLARS_ACTIVITES}}
{{PAGE_DIABLERETS}}
{{PAGE_DIABLERETS_HOTELS}}
{{PAGE_DIABLERETS_ACTIVITES}}
{{PAGE_CONTACT}}`}
        </pre>
      </div>
    </section>
  );
}
