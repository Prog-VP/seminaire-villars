"use client";

import { StatusChanger } from "./StatusChanger";
import { normalizeStatut } from "../utils";
import { getEffectiveDates, formatApproxDate } from "../utils";
import type { Offer, OfferComment } from "../types";

type OfferDetailHeaderProps = {
  offer: Offer;
  comments: OfferComment[];
  isEditing: boolean;
  onEdit: () => void;
  onStatusChange: (next: string) => Promise<void>;
  onViewAllComments: () => void;
  message: { type: "success" | "error"; text: string } | null;
};

export function OfferDetailHeader({
  offer,
  comments,
  isEditing,
  onEdit,
  onStatusChange,
  onViewAllComments,
  message,
}: OfferDetailHeaderProps) {
  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
      <div className="flex flex-wrap items-start gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Offre
            </span>
            <StatusChanger
              statut={normalizeStatut(offer.statut)}
              onChange={onStatusChange}
            />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {offer.societeContact}
          </h2>
          {offer.numeroOffre && (
            <p className="text-xs font-medium text-slate-400">
              N° {offer.numeroOffre}
            </p>
          )}
          <p className="text-sm text-slate-600">
            {[offer.typeSociete, offer.pays].filter(Boolean).join(" · ")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {offer.stationDemandee && offer.stationDemandee.split(",").map((s) => s.trim()).filter(Boolean).map((station) => (
              <span key={station} className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {station}
              </span>
            ))}
            {offer.langue && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {offer.langue}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          {!isEditing && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Contact principal
          </p>
          <p className="text-base font-medium text-slate-900">
            {[offer.titreContact, offer.prenomContact, offer.nomContact]
              .filter(Boolean)
              .join(" ") || "Non renseigné"}
          </p>
          <p className="text-xs text-slate-500">
            {offer.emailContact || "Email inconnu"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Type de séjour
          </p>
          <p className="text-base font-semibold text-slate-900">
            {offer.typeSejour || "Non défini"}
          </p>
          <p className="text-xs text-slate-500">
            {offer.nombrePax
              ? `${offer.nombrePax} participant${offer.nombrePax > 1 ? "s" : ""}`
              : "Participants inconnus"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Dates
            {(offer.dateOptions?.length ?? 0) > 1 && (
              <span className="ml-1 text-slate-300">
                ({offer.dateOptions!.length} options)
              </span>
            )}
          </p>
          {(() => {
            const eff = getEffectiveDates(offer);
            const firstOpt = offer.dateOptions?.[0];
            return (
              <p className="text-base font-semibold text-slate-900">
                {eff.du
                  ? firstOpt?.approximatif
                    ? formatApproxDate(eff.du)
                    : `${new Date(eff.du).toLocaleDateString("fr-CH")} → ${
                        eff.au
                          ? new Date(eff.au).toLocaleDateString("fr-CH")
                          : "?"
                      }`
                  : "Non défini"}
                {(offer.dateConfirmeeDu || offer.dateConfirmeeAu) && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Confirmée
                  </span>
                )}
              </p>
            );
          })()}
          <p className="text-xs text-slate-500">
            {offer.relanceEffectueeLe
              ? `Relancée le ${new Date(offer.relanceEffectueeLe).toLocaleDateString("fr-CH")}`
              : ""}
          </p>
        </div>
      </div>
      {comments.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notes / Commentaires
            </p>
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-slate-500">
              {comments.length}
            </span>
            <button
              type="button"
              onClick={onViewAllComments}
              className="ml-auto text-xs font-medium text-brand-900 hover:underline"
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[...comments]
              .sort((a, b) => (b.date ?? b.createdAt ?? "").localeCompare(a.date ?? a.createdAt ?? ""))
              .slice(0, 3)
              .map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-medium text-slate-600">{c.author}</span>
                  <span className="text-slate-400">·</span>
                  <p className="text-slate-700 line-clamp-2">{c.content}</p>
                </div>
              ))}
          </div>
        </div>
      )}
      {message && (
        <p
          className={`mt-4 inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
