"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

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
let cachedRawOfferIds: string | null = null;
let cachedOfferIds: string[] | null = null;

function subscribeToStoredOfferIds() {
  return () => {};
}

function readStoredOfferIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRawOfferIds = null;
      cachedOfferIds = null;
      return null;
    }
    if (raw !== cachedRawOfferIds) {
      cachedRawOfferIds = raw;
      cachedOfferIds = JSON.parse(raw) as string[];
    }
    return cachedOfferIds;
  } catch {
    return null;
  }
}

function getServerStoredOfferIds() {
  return null;
}

function getNavState(ids: string[] | null, currentId: string): NavState {
  if (!ids) return EMPTY;
  const index = ids.indexOf(currentId);
  if (index === -1) return EMPTY;
  return {
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index < ids.length - 1 ? ids[index + 1] : null,
    position: index + 1,
    total: ids.length,
  };
}

export function OfferNavArrows({ currentId, confirmMessage }: { currentId: string; confirmMessage?: string }) {
  const storedIds = useSyncExternalStore(
    subscribeToStoredOfferIds,
    readStoredOfferIds,
    getServerStoredOfferIds,
  );
  const nav = useMemo(() => getNavState(storedIds, currentId), [storedIds, currentId]);

  const { prevId, nextId, position, total } = nav;

  if (!prevId && !nextId) return null;

  return (
    <div className="ml-auto flex items-center gap-2">
      {position !== null && total !== null && (
        <span className="text-xs text-slate-400 tabular-nums">
          {position} / {total}
        </span>
      )}
      <NavArrow href={prevId ? `/offres/${prevId}` : null} direction="prev" confirmMessage={confirmMessage} />
      <NavArrow href={nextId ? `/offres/${nextId}` : null} direction="next" confirmMessage={confirmMessage} />
    </div>
  );
}

function NavArrow({ href, direction, confirmMessage }: { href: string | null; direction: "prev" | "next"; confirmMessage?: string }) {
  const isPrev = direction === "prev";
  const router = useRouter();
  const cls = "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 transition";

  const handleClick = (e: React.MouseEvent) => {
    if (confirmMessage && href) {
      e.preventDefault();
      if (window.confirm(confirmMessage)) {
        router.push(href);
      }
    }
  };

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
      onClick={handleClick}
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
