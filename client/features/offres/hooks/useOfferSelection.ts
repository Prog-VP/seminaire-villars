import { useState, useCallback } from "react";
import type { Offer } from "../types";

export function useOfferSelection(paginatedOffers: Offer[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const pageIds = paginatedOffers.map((o) => o.id);
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedOffers]);

  const allPageSelected = paginatedOffers.length > 0 && paginatedOffers.every((o) => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    allPageSelected,
    someSelected,
    clearSelection,
  };
}
