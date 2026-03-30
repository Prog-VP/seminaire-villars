"use client";

import type { ReactNode } from "react";
import type { Offer } from "./types";
import { DEFAULT_STATUTS, getStatutBadgeStyle, normalizeStatut } from "./utils";
import { Tip, CommentsPopover } from "./components/OfferTableRow";

export type ColumnDef = {
  key: string;
  label: string;
  /** CSS class applied to th/td for sizing (use min-w / max-w / whitespace-nowrap) */
  cellClass: string;
  defaultVisible: boolean;
  renderCell: (offer: Offer, extra: CellExtra) => ReactNode;
};

export type CellExtra = {
  statutColorMap?: Record<string, string | null>;
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-CH") : "—";

export const ALL_COLUMNS: ColumnDef[] = [
  {
    key: "numeroOffre",
    label: "N°",
    cellClass: "min-w-[40px] whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) => (
      <span className="text-xs text-slate-500 truncate">
        {o.numeroOffre ?? "—"}
      </span>
    ),
  },
  {
    key: "societeContact",
    label: "Société",
    cellClass: "min-w-[140px] max-w-[220px]",
    defaultVisible: true,
    renderCell: (o) => (
      <>
        <p className="font-medium text-slate-900 truncate text-sm">
          {o.societeContact}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {o.transmisPar ? `via ${o.transmisPar}` : "\u00A0"}
        </p>
      </>
    ),
  },
  {
    key: "contact",
    label: "Contact",
    cellClass: "min-w-[120px] max-w-[200px]",
    defaultVisible: true,
    renderCell: (o) => (
      <>
        <p className="truncate text-sm text-slate-700">
          {o.prenomContact || o.nomContact ? (
            <span>
              {o.titreContact ? `${o.titreContact} ` : ""}
              {[o.prenomContact, o.nomContact].filter(Boolean).join(" ")}
            </span>
          ) : (
            "—"
          )}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {o.emailContact || "—"}
        </p>
      </>
    ),
  },
  {
    key: "pays",
    label: "Pays",
    cellClass: "min-w-[45px] whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) => (
      <span className="text-xs text-slate-600">{o.pays}</span>
    ),
  },
  {
    key: "typeSejour",
    label: "Séjour",
    cellClass: "min-w-[80px] max-w-[120px]",
    defaultVisible: true,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.typeSejour ?? "—"}
      </span>
    ),
  },
  {
    key: "statut",
    label: "Statut",
    cellClass: "min-w-[80px] whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o, { statutColorMap }) => {
      const s = normalizeStatut(o.statut);
      const classes = getStatutBadgeStyle(s, DEFAULT_STATUTS, statutColorMap);
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${classes}`}
        >
          {s}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    label: "Envoi",
    cellClass: "min-w-[75px] whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) => (
      <span className="text-xs text-slate-500">{fmtDate(o.dateEnvoiOffre)}</span>
    ),
  },
  {
    key: "relance",
    label: "Rel.",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) =>
      o.relanceEffectueeLe ? (
        <Tip label={`Relancée le ${fmtDate(o.relanceEffectueeLe)}`}>
          <span className="text-emerald-600 text-xs">✓</span>
        </Tip>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      ),
  },
  {
    key: "hotelSendsCount",
    label: "Hôtels",
    cellClass: "min-w-[45px] text-center whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) =>
      (o.hotelSendsCount ?? 0) > 0 ? (
        <Tip label={o.hotelSendsNames?.join(", ") ?? ""}>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {o.hotelSendsCount}
          </span>
        </Tip>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      ),
  },
  {
    key: "hotelResponsesCount",
    label: "Rép.",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) =>
      (o.hotelResponses?.length ?? 0) > 0 ? (
        <Tip label={o.hotelResponses!.map((r) => r.hotelName).join(", ")}>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {o.hotelResponses!.length}
          </span>
        </Tip>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      ),
  },
  {
    key: "commentsCount",
    label: "Notes",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: true,
    renderCell: (o) => {
      const cmts = o.comments ?? [];
      if (cmts.length === 0)
        return <span className="text-xs text-slate-300">—</span>;
      return <CommentsPopover comments={cmts} societe={o.societeContact} />;
    },
  },
  // ─── Extra columns (hidden by default) ───
  {
    key: "emailContact",
    label: "Email",
    cellClass: "min-w-[130px] max-w-[200px]",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.emailContact || "—"}
      </span>
    ),
  },
  {
    key: "telephoneContact",
    label: "Téléphone",
    cellClass: "min-w-[100px] max-w-[140px]",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.telephoneContact || "—"}
      </span>
    ),
  },
  {
    key: "langue",
    label: "Langue",
    cellClass: "min-w-[50px] whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600">{o.langue || "—"}</span>
    ),
  },
  {
    key: "typeSociete",
    label: "Type société",
    cellClass: "min-w-[90px] max-w-[140px]",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.typeSociete || "—"}
      </span>
    ),
  },
  {
    key: "transmisPar",
    label: "Transmis par",
    cellClass: "min-w-[90px] max-w-[140px]",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.transmisPar || "—"}
      </span>
    ),
  },
  {
    key: "nombrePax",
    label: "Pax",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 tabular-nums">
        {o.nombrePax ?? "—"}
      </span>
    ),
  },
  {
    key: "nombreDeNuits",
    label: "Nuits",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 tabular-nums">
        {o.nombreDeNuits || "—"}
      </span>
    ),
  },
  {
    key: "categorieHotel",
    label: "Cat. hôtel",
    cellClass: "min-w-[70px] whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.categorieHotel || "—"}
      </span>
    ),
  },
  {
    key: "stationDemandee",
    label: "Station",
    cellClass: "min-w-[80px] max-w-[120px]",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.stationDemandee || "—"}
      </span>
    ),
  },
  {
    key: "traitePar",
    label: "Traité par",
    cellClass: "min-w-[80px] max-w-[120px]",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 truncate">
        {o.traitePar || "—"}
      </span>
    ),
  },
  {
    key: "dateOptions",
    label: "Dates séjour",
    cellClass: "min-w-[130px] whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => {
      const opt = o.dateOptions?.[0];
      if (!opt?.du) return <span className="text-xs text-slate-300">—</span>;
      return (
        <span className="text-xs text-slate-600">
          {fmtDate(opt.du)}
          {opt.au ? ` – ${fmtDate(opt.au)}` : ""}
        </span>
      );
    },
  },
  {
    key: "seminaire",
    label: "Séminaire",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs">
        {(o.seminaireJournee || o.seminaireDemiJournee) ? (
          <span className="text-emerald-600">✓</span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </span>
    ),
  },
  {
    key: "reservationEffectuee",
    label: "Réservé",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs">
        {o.reservationEffectuee ? (
          <span className="text-emerald-600">✓</span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </span>
    ),
  },
  {
    key: "attachmentsCount",
    label: "Annexes",
    cellClass: "min-w-[40px] text-center whitespace-nowrap",
    defaultVisible: false,
    renderCell: (o) => (
      <span className="text-xs text-slate-600 tabular-nums">
        {o.attachmentsCount ?? 0}
      </span>
    ),
  },
];

export const COLUMN_MAP = new Map(ALL_COLUMNS.map((c) => [c.key, c]));

export const DEFAULT_VISIBLE_KEYS = ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
