"use client";

import { useCallback, useMemo, useState } from "react";
import { useSettings } from "../context";
import { EditableSettingsList } from "./EditableSettingsList";
import type { SettingType } from "../types";
import { ChfEurRate } from "./ChfEurRate";
import { SettingsSectionsTable } from "./SettingsSectionsTable";
import { SettingsSidebar } from "./SettingsSidebar";
import { ShareEmailTemplateSettings } from "./ShareEmailTemplateSettings";
import { SETTINGS_PLACEHOLDERS, SETTINGS_SECTIONS } from "./settings-page-config";

export function SettingsPage() {
  const { error, isLoading, hasLoaded, settings } = useSettings();
  const [openType, setOpenType] = useState<SettingType | null>(null);
  const [search, setSearch] = useState("");

  const totals = useMemo(() => {
    return (
      Object.entries(settings) as [SettingType, (typeof settings)[SettingType]][]
    ).reduce(
      (acc, [type, values]) => {
        acc[type] = values.length;
        return acc;
      },
      {} as Record<SettingType, number>,
    );
  }, [settings]);

  const openSection = openType
    ? SETTINGS_SECTIONS.find((section) => section.type === openType) ?? null
    : null;

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query),
    );
  }, [search]);

  const closeSidebar = useCallback(() => setOpenType(null), []);

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un champ…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />

      <SettingsSectionsTable
        sections={filteredSections}
        totals={totals}
        isLoading={isLoading}
        hasLoaded={hasLoaded}
        onSelect={setOpenType}
      />

      <ChfEurRate />
      <ShareEmailTemplateSettings />

      <SettingsSidebar open={openSection !== null} onClose={closeSidebar}>
        {openSection && (hasLoaded || !isLoading) && (
          <EditableSettingsList
            key={openSection.type}
            type={openSection.type}
            title={openSection.title}
            description={openSection.description}
            placeholder={SETTINGS_PLACEHOLDERS[openSection.type]}
          />
        )}
      </SettingsSidebar>
    </section>
  );
}
