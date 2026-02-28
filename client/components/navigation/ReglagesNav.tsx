"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const subTabs = [
  { href: "/reglages/donnees-de-base", label: "Données de base" },
  { href: "/reglages/utilisateurs", label: "Utilisateurs" },
];

export function ReglagesNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {subTabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-brand-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
