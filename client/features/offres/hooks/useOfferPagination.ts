import { useMemo, useState } from "react";
import type { Offer } from "../types";

export const PAGE_SIZE_OPTIONS = [15, 30, 50, "all"] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export function useOfferPagination(items: Offer[]) {
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [currentPage, setCurrentPage] = useState(1);

  const totalFiltered = items.length;
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return items;
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    safePage,
    paginatedItems,
    totalFiltered,
    PAGE_SIZE_OPTIONS,
  };
}
