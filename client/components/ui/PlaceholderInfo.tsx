"use client";

import { useEffect, useRef, useState } from "react";

const COVER_PLACEHOLDERS = [
  { key: "{{SOCIETE}}", desc: "Nom de l'entreprise" },
  { key: "{{MOIS_ANNEE}}", desc: "Mois et année du séjour" },
  { key: "{{NOMBRE_PAX}}", desc: "Nombre de participants" },
  { key: "{{NOM_CONTACT}}", desc: "Nom du contact" },
  { key: "{{PRENOM_CONTACT}}", desc: "Prénom du contact" },
  { key: "{{EMAIL_CONTACT}}", desc: "Email du contact" },
];

const HOTEL_PLACEHOLDERS = [
  { key: "{{OFFER_TEXT}}", desc: "Texte libre de l'offre hôtelière" },
];

type Props = {
  type: "documents" | "hotels";
};

export function PlaceholderInfo({ type }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const items =
    type === "documents"
      ? COVER_PLACEHOLDERS
      : [...HOTEL_PLACEHOLDERS, ...COVER_PLACEHOLDERS];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function copy(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-400 hover:border-slate-400 hover:text-slate-600 transition"
        title="Placeholders disponibles pour les templates"
      >
        i
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-50 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Placeholders pour les templates .docx
          </p>
          <p className="mb-3 text-[11px] text-slate-400">
            Cliquer pour copier
          </p>
          <ul className="space-y-1">
            {items.map(({ key, desc }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => copy(key)}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-slate-50 transition"
                >
                  <span>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                      {key}
                    </code>
                    <span className="ml-2 text-slate-400">{desc}</span>
                  </span>
                  <span className="ml-2 text-[10px] text-green-600 min-w-[16px]">
                    {copied === key ? "✓" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
