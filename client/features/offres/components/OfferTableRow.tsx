"use client";

import { useEffect, useRef, useState } from "react";
import type { Offer, OfferComment } from "../types";
import type { ColumnDef, CellExtra } from "../column-config";

type OfferTableRowProps = {
  offer: Offer;
  index: number;
  globalIndex: number;
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onNavigate: (id: string) => void;
  columns: ColumnDef[];
  cellExtra: CellExtra;
};

const STOP_PROPAGATION_COLS = new Set(["commentsCount"]);

export function OfferTableRow({
  offer,
  index,
  globalIndex,
  isSelected,
  onToggleSelect,
  onNavigate,
  columns,
  cellExtra,
}: OfferTableRowProps) {
  return (
    <tr
      onClick={() => onNavigate(offer.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate(offer.id);
        }
      }}
      tabIndex={0}
      role="button"
      className={`cursor-pointer border-t border-slate-100 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
        index % 2 === 1 ? "bg-slate-50/60" : ""
      } ${isSelected ? "bg-brand-50/60" : ""}`}
    >
      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={(e) => onToggleSelect(offer.id, e)}
          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-900 focus:ring-brand-500"
        />
      </td>
      <td className="px-2 py-2 text-xs text-slate-400 tabular-nums">
        {globalIndex}
      </td>
      {columns.map((col) => (
        <td
          key={col.key}
          className={`px-2 py-2 ${col.cellClass}`}
          onClick={
            STOP_PROPAGATION_COLS.has(col.key)
              ? (e) => e.stopPropagation()
              : undefined
          }
        >
          {col.renderCell(offer, cellExtra)}
        </td>
      ))}
    </tr>
  );
}

export function CommentsPopover({ comments, societe }: { comments: OfferComment[]; societe: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
      >
        {comments.length}
      </button>
      {open && (
        <div className="fixed z-[9999] w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl" style={{ bottom: "auto", right: "auto" }} ref={(el) => {
          if (!el || !ref.current) return;
          const btn = ref.current.querySelector("button");
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          el.style.left = `${Math.max(8, rect.right - 320)}px`;
          el.style.top = `${Math.max(8, rect.top - el.offsetHeight - 8)}px`;
        }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notes — {societe}
          </p>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="mb-0.5 text-xs font-medium text-slate-500">
                  {c.author || "—"}
                  {c.date ? ` · ${new Date(c.date).toLocaleDateString("fr-CH")}` : ""}
                </p>
                <p className="whitespace-pre-line text-slate-700">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-pre-line rounded-md bg-slate-800 px-2.5 py-1.5 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 max-w-sm max-h-32 overflow-hidden">
        {label}
      </span>
    </span>
  );
}
