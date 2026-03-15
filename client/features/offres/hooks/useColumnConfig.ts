import { useCallback, useEffect, useState } from "react";
import {
  ALL_COLUMNS,
  COLUMN_MAP,
  DEFAULT_VISIBLE_KEYS,
  type ColumnDef,
} from "../column-config";

const STORAGE_KEY = "offer-column-config";

function loadConfig(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      // Filter out keys that no longer exist
      const valid = parsed.filter((k) => COLUMN_MAP.has(k));
      if (valid.length > 0) return valid;
    }
  } catch {}
  return [...DEFAULT_VISIBLE_KEYS];
}

export function useColumnConfig() {
  const [visibleKeys, setVisibleKeys] = useState<string[]>(loadConfig);

  useEffect(() => {
    const isDefault =
      JSON.stringify(visibleKeys) === JSON.stringify(DEFAULT_VISIBLE_KEYS);
    if (isDefault) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleKeys));
  }, [visibleKeys]);

  const visibleColumns: ColumnDef[] = visibleKeys
    .map((k) => COLUMN_MAP.get(k)!)
    .filter(Boolean);

  const hiddenColumns: ColumnDef[] = ALL_COLUMNS.filter(
    (c) => !visibleKeys.includes(c.key)
  );

  const addColumn = useCallback((key: string) => {
    setVisibleKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, []);

  const removeColumn = useCallback((key: string) => {
    setVisibleKeys((prev) => prev.filter((k) => k !== key));
  }, []);

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      setVisibleKeys((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    []
  );

  const resetToDefault = useCallback(() => {
    setVisibleKeys([...DEFAULT_VISIBLE_KEYS]);
  }, []);

  return {
    visibleColumns,
    hiddenColumns,
    visibleKeys,
    addColumn,
    removeColumn,
    reorderColumns,
    resetToDefault,
  };
}
