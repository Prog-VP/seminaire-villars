"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/offres",
    label: "Offres",
    shortLabel: "OF",
  },
  {
    href: "/stats",
    label: "Stats",
    shortLabel: "ST",
  },
];

const reglagesChildren = [
  { href: "/reglages/donnees-de-base", label: "Données de base" },
  { href: "/reglages/utilisateurs", label: "Utilisateurs" },
];

type NavTabsProps = {
  isCollapsed?: boolean;
  onNavigate?: () => void;
};

export function NavTabs({ isCollapsed = false, onNavigate }: NavTabsProps) {
  const pathname = usePathname();
  const isReglagesActive = pathname.startsWith("/reglages");

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

      {/* Réglages section with sub-links */}
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
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Réglages
          </p>
          <div className="flex flex-col gap-0.5">
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
