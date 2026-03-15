"use client";

import { useCallback, useRef, useState } from "react";
import { useSettings } from "@/features/settings/context";
import {
  importOffersFromFile,
  downloadImportTemplate,
  type ImportResult,
  type AllowedValues,
} from "../import";

type Props = {
  onImportDone: () => void;
};

export function ImportOffersDropzone({ onImportDone }: Props) {
  const { options } = useSettings();
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
        setError("Format non supporté. Utilisez un fichier .xlsx, .xls ou .csv.");
        return;
      }

      setError(null);
      setResult(null);
      setIsImporting(true);

      try {
        const allowed: AllowedValues = {
          typeSociete: options.typeSociete,
          typeSejour: options.typeSejour,
          categorieHotel: options.categorieHotel,
          stationDemandee: options.stationDemandee,
          transmisPar: options.transmisPar,
          traitePar: options.traitePar,
          langue: options.langue,
          pays: options.pays,
          titreContact: options.titreContact,
          statut: options.statut,
        };
        const res = await importOffersFromFile(file, allowed);
        setResult(res);
        if (res.created > 0 || res.updated > 0) {
          onImportDone();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de l'import.",
        );
      } finally {
        setIsImporting(false);
      }
    },
    [onImportDone, options],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-imported
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        } ${isImporting ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
        />

        {isImporting ? (
          <div className="space-y-2">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-brand-600" />
            <p className="text-sm font-medium text-slate-600">
              Import en cours...
            </p>
          </div>
        ) : (
          <>
            <div className="text-3xl text-slate-400">
              <span aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Glissez un fichier Excel ici ou{" "}
              <span className="text-brand-600 underline">parcourir</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Formats acceptés : .xlsx, .xls, .csv
            </p>
          </>
        )}
      </div>

      {/* Template download */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => downloadImportTemplate({
            typeSociete: options.typeSociete,
            typeSejour: options.typeSejour,
            categorieHotel: options.categorieHotel,
            stationDemandee: options.stationDemandee,
            transmisPar: options.transmisPar,
            traitePar: options.traitePar,
            langue: options.langue,
            pays: options.pays,
            titreContact: options.titreContact,
            statut: options.statut,
          })}
          className="text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800"
        >
          Télécharger le modèle d'import (.xlsx)
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            result.errors.length > 0
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          {result.errors.length > 0 ? (
            <>
              <p className="font-semibold text-red-800">
                Import bloqué — {result.errors.length} erreur{result.errors.length > 1 ? "s" : ""} détectée{result.errors.length > 1 ? "s" : ""}.
                Aucune offre n&apos;a été importée.
              </p>
              <p className="mt-1 text-xs text-red-700">
                Corrigez toutes les erreurs dans le fichier puis réessayez.
              </p>
              <details className="mt-2" open>
                <summary className="cursor-pointer text-xs font-medium text-red-700">
                  Détail des erreurs
                </summary>
                <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto text-xs text-slate-700">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      {err.row > 0 ? `Ligne ${err.row} : ` : ""}{err.message}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <p className="font-semibold text-slate-900">
              {result.created > 0 && (
                <>{result.created} offre{result.created > 1 ? "s" : ""} créée{result.created > 1 ? "s" : ""}. </>
              )}
              {result.updated > 0 && (
                <>{result.updated} offre{result.updated > 1 ? "s" : ""} mise{result.updated > 1 ? "s" : ""} à jour. </>
              )}
              {result.created === 0 && result.updated === 0 && "Aucune offre importée. "}
              ({result.total} ligne{result.total > 1 ? "s" : ""} traitée{result.total > 1 ? "s" : ""})
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
