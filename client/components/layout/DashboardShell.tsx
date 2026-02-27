"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NavTabs } from "@/components/navigation/NavTabs";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={`hidden min-h-screen flex-col border-r border-white/70 bg-white/80 backdrop-blur-xl md:flex ${
          isCollapsed ? "w-20" : "w-64"
        } transition-[width] duration-200`}
      >
        <div
          className={`flex gap-3 px-4 py-5 ${
            isCollapsed ? "flex-col items-center" : "items-center"
          }`}
        >
          {!isCollapsed && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Séminaire
              </p>
              <p className="text-base font-semibold text-slate-900">
                Tableau de bord
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-pressed={isCollapsed}
            className={`rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 ${
              isCollapsed ? "" : "ml-auto"
            }`}
          >
            <span className="sr-only">
              {isCollapsed ? "Déployer le menu" : "Réduire le menu"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`h-4 w-4 transform transition ${
                isCollapsed ? "rotate-180" : ""
              }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavTabs isCollapsed={isCollapsed} />
        </div>
        <div
          className={`border-t border-slate-100 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-400 ${
            isCollapsed ? "text-center" : ""
          }`}
        >
          {isCollapsed ? "DV" : "Destination Villars"}
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-200 md:hidden ${
          isMobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden="true"
        onClick={closeMobile}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/70 bg-white/80 shadow-lg backdrop-blur-xl transition-transform duration-200 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Séminaire
            </p>
            <p className="text-base font-semibold text-slate-900">
              Tableau de bord
            </p>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
          >
            <span className="sr-only">Fermer le menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavTabs onNavigate={closeMobile} />
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/70 bg-white/80 backdrop-blur-xl px-6 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Séminaire
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Tableau de bord
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
            >
              {isSigningOut ? "Déconnexion..." : "Déconnexion"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 md:hidden"
              onClick={toggleMobile}
            >
              <span className="sr-only">Ouvrir le menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-5xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
