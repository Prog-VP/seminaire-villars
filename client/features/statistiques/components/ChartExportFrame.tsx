"use client";

import { useRef, useState, type ReactNode } from "react";
import { toBlob } from "html-to-image";
import { downloadBlob } from "@/lib/download";

type ExportStatus = "idle" | "copying" | "copied" | "downloading" | "downloaded" | "error";

type ChartExportFrameProps = {
  children: ReactNode;
  fileName: string;
};

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ChartExportFrame({ children, fileName }: ChartExportFrameProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ExportStatus>("idle");

  const createBlob = async () => {
    if (!contentRef.current) throw new Error("Graphique introuvable.");
    await document.fonts?.ready;
    const blob = await toBlob(contentRef.current, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      pixelRatio: 1,
    });
    if (!blob) throw new Error("Export impossible.");
    return blob;
  };

  const downloadImage = async () => {
    setStatus("downloading");
    try {
      const blob = await createBlob();
      downloadBlob(blob, `${safeFileName(fileName)}.png`);
      setStatus("downloaded");
    } catch {
      setStatus("error");
    }
  };

  const copyImage = async () => {
    setStatus("copying");
    let blob: Blob;
    try {
      blob = await createBlob();
    } catch {
      setStatus("error");
      return;
    }

    if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
      downloadBlob(blob, `${safeFileName(fileName)}.png`);
      setStatus("downloaded");
      return;
    }

    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setStatus("copied");
    } catch {
      downloadBlob(blob, `${safeFileName(fileName)}.png`);
      setStatus("downloaded");
    }
  };

  const disabled = status === "copying" || status === "downloading";
  const message =
    status === "copied"
      ? "Copié"
      : status === "downloaded"
        ? "PNG téléchargé"
        : status === "error"
          ? "Échec"
          : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        {message && (
          <span className={`text-[11px] font-medium ${status === "error" ? "text-rose-500" : "text-slate-400"}`}>
            {message}
          </span>
        )}
        <button
          type="button"
          onClick={copyImage}
          disabled={disabled}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
          title="Copier le graphique en PNG"
        >
          {status === "copying" ? "Copie..." : "Copier"}
        </button>
        <button
          type="button"
          onClick={downloadImage}
          disabled={disabled}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
          title="Télécharger le graphique en PNG"
        >
          PNG
        </button>
      </div>
      <div className="overflow-x-auto">
        <div ref={contentRef} className="inline-block bg-white px-1 py-1 align-top">
          {children}
        </div>
      </div>
    </div>
  );
}
