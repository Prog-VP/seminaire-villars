"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  numeroOffre: string | null;
  societeContact: string;
  nomContact: string | null;
  prenomContact: string | null;
  emailContact: string | null;
  pays: string | null;
  statut: string | null;
  dateEnvoiOffre: string | null;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const term = normalize(trimmed);

      // Fetch a broad set of offers (light columns only)
      const { data } = await supabase
        .from("offers")
        .select(
          "id, numeroOffre, societeContact, nomContact, prenomContact, emailContact, pays, statut, dateEnvoiOffre, telephoneContact, typeSociete, typeSejour, transmisPar, langue, traitePar, stationDemandee, categorieHotel"
        )
        .order("createdAt", { ascending: false })
        .limit(500);

      if (!data) {
        setResults([]);
        return;
      }

      // Client-side filter across all text fields
      const matched = data.filter((row) => {
        const haystack = normalize(
          [
            row.numeroOffre,
            row.societeContact,
            row.nomContact,
            row.prenomContact,
            row.emailContact,
            row.telephoneContact,
            row.pays,
            row.statut,
            row.typeSociete,
            row.typeSejour,
            row.transmisPar,
            row.langue,
            row.traitePar,
            row.stationDemandee,
            row.categorieHotel,
            row.dateEnvoiOffre,
          ]
            .filter(Boolean)
            .join(" ")
        );
        // Support multi-word search: all words must match
        return term.split(/\s+/).every((word) => haystack.includes(word));
      });

      setResults(
        matched.slice(0, 20).map((r) => ({
          id: r.id as string,
          numeroOffre: r.numeroOffre as string | null,
          societeContact: r.societeContact as string,
          nomContact: r.nomContact as string | null,
          prenomContact: r.prenomContact as string | null,
          emailContact: r.emailContact as string | null,
          pays: r.pays as string | null,
          statut: r.statut as string | null,
          dateEnvoiOffre: r.dateEnvoiOffre as string | null,
        }))
      );
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const navigate = (id: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/offres/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigate(results[selectedIndex].id);
    }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une offre..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-16 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">Recherche...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">
              Aucun résultat pour &ldquo;{query.trim()}&rdquo;
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(r.id)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                i === selectedIndex
                  ? "bg-brand-50 text-brand-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {r.societeContact}
                  {r.numeroOffre && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      #{r.numeroOffre}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {[
                    r.prenomContact || r.nomContact
                      ? [r.prenomContact, r.nomContact]
                          .filter(Boolean)
                          .join(" ")
                      : null,
                    r.emailContact,
                    r.pays,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {r.statut && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {r.statut}
                  </span>
                )}
                {r.dateEnvoiOffre && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.dateEnvoiOffre).toLocaleDateString("fr-CH")}
                  </span>
                )}
              </div>
            </button>
          ))}
          {results.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
              ↑↓ naviguer · ↵ ouvrir · esc fermer
            </div>
          )}
        </div>
      )}
    </div>
  );
}
