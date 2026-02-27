"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SettingType, SettingsMap, SettingValue } from "./types";
import {
  createSettingValue,
  deleteSettingValue,
  fetchSettings,
  updateSettingValue,
} from "./api";
import { DEFAULT_SETTING_OPTIONS, EMPTY_SETTINGS_MAP } from "./constants";

type SettingsContextValue = {
  settings: SettingsMap;
  options: Record<SettingType, string[]>;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  refresh: () => Promise<void>;
  addValue: (type: SettingType, label: string) => Promise<SettingValue>;
  editValue: (
    id: string,
    type: SettingType,
    label: string
  ) => Promise<SettingValue>;
  removeValue: (id: string, type: SettingType) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>(EMPTY_SETTINGS_MAP);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchSettings();
      setSettings(data);
      setHasLoaded(true);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de charger les réglages.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addValue = useCallback(async (type: SettingType, label: string) => {
    const created = await createSettingValue(type, label);
    setSettings((prev) => {
      const next = [...prev[type], created].sort((a, b) =>
        a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
      );
      return { ...prev, [type]: next };
    });
    setHasLoaded(true);
    return created;
  }, []);

  const editValue = useCallback(
    async (id: string, type: SettingType, label: string) => {
      const updated = await updateSettingValue(id, label);
      setSettings((prev) => {
        const next = prev[type].map((item) =>
          item.id === id ? updated : item
        );
        next.sort((a, b) =>
          a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
        );
        return { ...prev, [type]: next };
      });
      return updated;
    },
    []
  );

  const removeValue = useCallback(async (id: string, type: SettingType) => {
    await deleteSettingValue(id);
    setSettings((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  }, []);

  const options = useMemo(() => {
    if (!hasLoaded) {
      return DEFAULT_SETTING_OPTIONS;
    }
    return (Object.keys(settings) as SettingType[]).reduce(
      (acc, type) => {
        acc[type] = settings[type].map((item) => item.label);
        return acc;
      },
      {} as Record<SettingType, string[]>
    );
  }, [hasLoaded, settings]);

  const value = useMemo(
    () => ({
      settings,
      options,
      isLoading,
      error,
      hasLoaded,
      refresh,
      addValue,
      editValue,
      removeValue,
    }),
    [settings, options, isLoading, error, hasLoaded, refresh, addValue, editValue, removeValue]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
