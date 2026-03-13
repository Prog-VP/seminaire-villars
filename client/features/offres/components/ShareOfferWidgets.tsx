"use client";

import type { InputHTMLAttributes } from "react";
import { formatDate } from "@/lib/format";
import type { HotelResponseConfirmation } from "@/features/offres/types";
import { inputClass } from "./share-offer-utils";

export function ConfirmationPreview({
  confirmation,
}: {
  confirmation: HotelResponseConfirmation;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="rounded-2xl bg-gradient-to-r from-brand-900 to-brand-500 p-6 text-white shadow-inner">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Confirmation envoyée
        </p>
        <h2 className="mt-2 text-3xl font-semibold">{confirmation.hotel}</h2>
        <p className="mt-1 text-sm text-white/80">
          Réponse transmise le {formatDate(confirmation.submittedAt)}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoCard
          title="Informations client"
          items={[
            { label: "Client", value: confirmation.client },
            {
              label: "Séjour",
              value: `${confirmation.stay.from} au ${confirmation.stay.to}`,
            },
            {
              label: "Participants",
              value:
                typeof confirmation.participants === "number"
                  ? `${confirmation.participants} personnes`
                  : "Non précisé",
            },
          ]}
        />
        <InfoCard
          title="Détails de l'hôtel"
          items={[
            { label: "Hôtel", value: confirmation.hotel },
            { label: "Contact", value: confirmation.contact || "Non communiqué" },
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Réponse détaillée
        </p>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-800">
          {confirmation.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        Imprimer cette confirmation
      </button>
    </section>
  );
}

export function InfoCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p>{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TemplateField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input className={inputClass} {...props} />
    </label>
  );
}
