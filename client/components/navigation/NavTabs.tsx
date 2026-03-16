"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationNavLink } from "@/features/notifications/components/NotificationPanel";

const tabs = [
  {
    href: "/offres",
    label: "Offres",
    shortLabel: "OF",
  },
  {
    href: "/statistiques",
    label: "Statistiques",
    shortLabel: "ST",
  },
];

const reglagesChildren = [
  { href: "/reglages/donnees-de-base", label: "Données de base" },
  { href: "/reglages/utilisateurs", label: "Utilisateurs" },
  { href: "/reglages/hotels", label: "Hôtels" },
  { href: "/reglages/notifications", label: "Emails sortants" },
  { href: "/reglages/documents", label: "Documents" },
];

type NavTabsProps = {
  isCollapsed?: boolean;
  onNavigate?: () => void;
};

export function NavTabs({ isCollapsed = false, onNavigate }: NavTabsProps) {
  const pathname = usePathname();
  const isReglagesActive = pathname.startsWith("/reglages");
  const [isReglagesOpen, setIsReglagesOpen] = useState(isReglagesActive);

  return (
    <nav
      className={`flex flex-col gap-1 ${isCollapsed ? "items-center" : "items-stretch"}`}
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={isCollapsed ? tab.label : undefined}
            onClick={() => onNavigate?.()}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-brand-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold uppercase tracking-wide transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
              } ${isCollapsed ? "" : "shrink-0"}`}
            >
              {tab.shortLabel}
            </span>
            {!isCollapsed && (
              <span className="text-sm font-medium leading-tight">
                {tab.label}
              </span>
            )}
          </Link>
        );
      })}

      {/* Dernières nouvelles */}
      <NotificationNavLink isCollapsed={isCollapsed} />

      {/* Réglages section — collapsible */}
      {isCollapsed ? (
        <Link
          href="/reglages/donnees-de-base"
          aria-label="Réglages"
          onClick={() => onNavigate?.()}
          className={`group flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition ${
            isReglagesActive
              ? "bg-brand-900 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold uppercase tracking-wide transition ${
              isReglagesActive
                ? "bg-white/15 text-white"
                : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
            }`}
          >
            RG
          </span>
        </Link>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsReglagesOpen((prev) => !prev)}
            className="group flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-600"
          >
            Réglages
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 transition-transform duration-200 ${isReglagesOpen ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div
            className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-200 ${
              isReglagesOpen ? "mt-1 max-h-60 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {reglagesChildren.map((child) => {
              const isActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onNavigate?.()}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
