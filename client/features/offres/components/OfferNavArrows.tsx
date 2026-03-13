"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "offer-list-ids";

export function saveOfferListIds(ids: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage full or unavailable
  }
}

type NavState = {
  prevId: string | null;
  nextId: string | null;
  position: number | null;
  total: number | null;
};

const EMPTY: NavState = { prevId: null, nextId: null, position: null, total: null };

export function OfferNavArrows({ currentId }: { currentId: string }) {
  const [nav, setNav] = useState<NavState>(EMPTY);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids: string[] = JSON.parse(raw);
      const idx = ids.indexOf(currentId);
      if (idx === -1) return;
      setNav({
        prevId: idx > 0 ? ids[idx - 1] : null,
        nextId: idx < ids.length - 1 ? ids[idx + 1] : null,
        position: idx + 1,
        total: ids.length,
      });
    } catch {
      // ignore
    }
  }, [currentId]);

  const { prevId, nextId, position, total } = nav;

  if (!prevId && !nextId) return null;

  return (
    <div className="ml-auto flex items-center gap-2">
      {position !== null && total !== null && (
        <span className="text-xs text-slate-400 tabular-nums">
          {position} / {total}
        </span>
      )}
      <NavArrow href={prevId ? `/offres/${prevId}` : null} direction="prev" />
      <NavArrow href={nextId ? `/offres/${nextId}` : null} direction="next" />
    </div>
  );
}

function NavArrow({ href, direction }: { href: string | null; direction: "prev" | "next" }) {
  const isPrev = direction === "prev";
  const cls = "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 transition";

  if (!href) {
    return (
      <span
        className={`${cls} border-slate-100 text-slate-300 cursor-not-allowed`}
        title={isPrev ? "Offre précédente" : "Offre suivante"}
      >
        <ArrowIcon direction={direction} />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${cls} border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900`}
      title={isPrev ? "Offre précédente" : "Offre suivante"}
    >
      <ArrowIcon direction={direction} />
    </Link>
  );
}

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      {direction === "prev" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  );
}
