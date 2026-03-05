"use client";

import { useEffect, useRef, useState } from "react";
import type { OfferStatut } from "../types";
import { OFFER_STATUTS, STATUT_BADGE_STYLES, getStatutLabel } from "../utils";

export function StatusChanger({
  statut,
  onChange,
}: {
  statut: OfferStatut;
  onChange: (next: OfferStatut) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const badgeClasses = STATUT_BADGE_STYLES[statut] ?? STATUT_BADGE_STYLES.brouillon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${badgeClasses}`}
      >
        {getStatutLabel(statut)}
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {OFFER_STATUTS.map((s) => {
            const isActive = s.value === statut;
            const dotClasses = STATUT_BADGE_STYLES[s.value];
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span className={`inline-block h-2 w-2 rounded-full ${dotClasses.split(" ")[0]}`} />
                <span className="flex-1">{s.label}</span>
                {isActive && (
                  <span className="text-emerald-600">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
