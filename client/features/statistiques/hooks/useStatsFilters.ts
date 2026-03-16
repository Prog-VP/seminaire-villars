"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Dimension, Filters, YearPin, MonthFilters, YearFilters } from "../types";
import { DIMENSIONS } from "../types";

export function useStatsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* ── Read state from URL ── */
  const filters = useMemo<Filters>(() => {
    const f: Filters = {};
    for (const dim of DIMENSIONS) {
      const v = searchParams.get(dim);
      if (v) f[dim] = v;
    }
    return f;
  }, [searchParams]);

  const yearPin = useMemo<YearPin>(() => {
    const d = searchParams.get("pinDim") as Dimension | null;
    const y = searchParams.get("pinYear");
    if (d && y) return { dim: d, year: Number(y) };
    return null;
  }, [searchParams]);

  const monthFilters = useMemo<MonthFilters>(() => {
    const e = searchParams.get("mEnvoi");
    const s = searchParams.get("mSejour");
    return {
      ...(e != null ? { envoi: Number(e) } : {}),
      ...(s != null ? { sejour: Number(s) } : {}),
    };
  }, [searchParams]);

  const yearFilters = useMemo<YearFilters>(() => {
    const v = searchParams.get("years");
    if (!v) return new Set<number>();
    return new Set(v.split(",").map(Number).filter((n) => !Number.isNaN(n)));
  }, [searchParams]);

  const hotelFilter = searchParams.get("hotel") || undefined;

  const activeTab = searchParams.get("tab") === "hotels" ? "hotels" as const : "general" as const;

  /* ── Write state to URL ── */
  const pushParams = useCallback(
    (updater: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      updater(p);
      // Clean empty params
      for (const [k, v] of Array.from(p.entries())) {
        if (!v) p.delete(k);
      }
      const qs = p.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const toggleFilter = useCallback((dim: Dimension, value: string) => {
    pushParams((p) => {
      if (p.get(dim) === value) {
        p.delete(dim);
      } else {
        p.set(dim, value);
      }
      // Clear year pin on this dim
      if (p.get("pinDim") === dim) {
        p.delete("pinDim");
        p.delete("pinYear");
      }
    });
  }, [pushParams]);

  const toggleCellFilter = useCallback((dim: Dimension, value: string, year: number) => {
    pushParams((p) => {
      p.set(dim, value);
      if (p.get("pinDim") === dim && p.get("pinYear") === String(year)) {
        p.delete("pinDim");
        p.delete("pinYear");
      } else {
        p.set("pinDim", dim);
        p.set("pinYear", String(year));
      }
    });
  }, [pushParams]);

  const toggleMonthFilter = useCallback((type: "envoi" | "sejour", month: number) => {
    const key = type === "envoi" ? "mEnvoi" : "mSejour";
    pushParams((p) => {
      if (p.get(key) === String(month)) {
        p.delete(key);
      } else {
        p.set(key, String(month));
      }
    });
  }, [pushParams]);

  const clearFilter = useCallback((dim: Dimension) => {
    pushParams((p) => {
      p.delete(dim);
      if (p.get("pinDim") === dim) {
        p.delete("pinDim");
        p.delete("pinYear");
      }
    });
  }, [pushParams]);

  const clearMonthFilter = useCallback((type: "envoi" | "sejour") => {
    pushParams((p) => {
      p.delete(type === "envoi" ? "mEnvoi" : "mSejour");
    });
  }, [pushParams]);

  const toggleYearFilter = useCallback((year: number) => {
    pushParams((p) => {
      const current = p.get("years");
      const set = current
        ? new Set(current.split(",").map(Number).filter((n) => !Number.isNaN(n)))
        : new Set<number>();
      if (set.has(year)) {
        set.delete(year);
      } else {
        set.add(year);
      }
      if (set.size > 0) {
        p.set("years", Array.from(set).sort().join(","));
      } else {
        p.delete("years");
      }
    });
  }, [pushParams]);

  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    filters,
    yearPin,
    monthFilters,
    yearFilters,
    hotelFilter,
    activeTab,
    searchParams,
    pushParams,
    toggleFilter,
    toggleCellFilter,
    toggleMonthFilter,
    clearFilter,
    clearMonthFilter,
    toggleYearFilter,
    clearAllFilters,
  };
}
