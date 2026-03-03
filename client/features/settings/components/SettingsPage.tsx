"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "../context";
import { EditableSettingsList } from "./EditableSettingsList";
import type { SettingType } from "../types";

const SECTIONS: Array<{
  type: SettingType;
  title: string;
  description: string;
}> = [
  {
    type: "categorieHotel",
    title: "Catégories d'hôtel",
    description: "Classements proposés aux clients.",
  },
  {
    type: "langue",
    title: "Langues",
    description: "Choix disponibles pour la communication.",
  },
  {
    type: "pays",
    title: "Pays",
    description: "Marchés proposés dans le formulaire.",
  },
  {
    type: "stationDemandee",
    title: "Stations demandées",
    description: "Destinations proposées (Villars, etc.).",
  },
  {
    type: "titreContact",
    title: "Titres de contact",
    description: "Civilités disponibles dans le formulaire.",
  },
  {
    type: "traitePar",
    title: "Traité par",
    description: "Collaborateurs pouvant suivre une offre.",
  },
  {
    type: "transmisPar",
    title: "Transmis par",
    description: "Canaux d'entrée (OT, SCIB, VP...).",
  },
  {
    type: "typeSejour",
    title: "Types de séjour",
    description: "Segments utilisés pour les demandes.",
  },
  {
    type: "typeSociete",
    title: "Types de société",
    description: "Catégories d'interlocuteurs entrants.",
  },
];

const PLACEHOLDER_MAP: Record<SettingType, string> = {
  transmisPar: "Ajouter un canal",
  traitePar: "Ajouter des initiales",
  pays: "Ajouter un pays (ex. CH)",
  langue: "Ajouter une langue",
  typeSociete: "Ajouter un type de société",
  typeSejour: "Ajouter un type de séjour",
  categorieHotel: "Ajouter une catégorie",
  stationDemandee: "Ajouter une station",
  titreContact: "Ajouter un titre/civilité",
  emailNotification: "Ajouter un email",
};

export function SettingsPage() {
  const { error, isLoading, hasLoaded, settings } = useSettings();
  const totals = useMemo(() => {
    return (
      Object.entries(settings) as [SettingType, (typeof settings)[SettingType]][]
    ).reduce(
      (acc, [type, values]) => {
        acc[type] = values.length;
        return acc;
      },
      {} as Record<SettingType, number>
    );
  }, [settings]);

  const [openType, setOpenType] = useState<SettingType | null>(null);
  const [search, setSearch] = useState("");
  const openSection = openType
    ? SECTIONS.find((s) => s.type === openType) ?? null
    : null;

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.trim().toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
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
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un champ…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Champ
              </th>
              <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                Description
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Options
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSections.map((section) => (
              <tr
                key={section.type}
                onClick={() => setOpenType(section.type)}
                className="cursor-pointer transition hover:bg-slate-50"
              >
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {section.title}
                </td>
                <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">
                  {section.description}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {isLoading && !hasLoaded ? "…" : totals[section.type]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar overlay */}
      <Sidebar open={openSection !== null} onClose={closeSidebar}>
        {openSection && (hasLoaded || !isLoading) && (
          <EditableSettingsList
            key={openSection.type}
            type={openSection.type}
            title={openSection.title}
            description={openSection.description}
            placeholder={PLACEHOLDER_MAP[openSection.type]}
          />
        )}
      </Sidebar>
    </section>
  );
}

function Sidebar({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">
            Modifier les options
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}
