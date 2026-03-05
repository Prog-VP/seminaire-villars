import type { Offer } from "@/features/offres/types";
import type { OfferStats } from "./utils";
import { getEffectiveDates, getStatutLabel } from "@/features/offres/utils";
import * as XLSX from "xlsx";

const SEP = ";";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function yearLabel(year: number | null) {
  return year === null ? "toutes_annees" : String(year);
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function exportStatsCSV(
  offers: Offer[],
  stats: OfferStats,
  year: number | null,
) {
  const lines: string[] = [];

  const push = (...cols: (string | number)[]) =>
    lines.push(cols.map((c) => String(c)).join(SEP));

  // Résumé KPI
  push("=== Résumé KPI ===");
  push("Total offres", stats.totalOffers);
  push("Avec date d'envoi", stats.offersWithSendDate);
  push("Réponses hôtels", stats.totalHotelResponses);
  push(
    "Durée moyenne séjour (nuits)",
    stats.averageStayLength !== null
      ? stats.averageStayLength.toFixed(1)
      : "N/A",
  );
  push(
    "Taille moyenne groupe",
    stats.averageGroupSize !== null
      ? stats.averageGroupSize.toFixed(1)
      : "N/A",
  );
  push(
    "Confirmées hébergement",
    stats.confirmedSplit.hebergement,
  );
  push(
    "Confirmées activité uniquement",
    stats.confirmedSplit.activite,
  );
  push("");

  // Provenance
  push("=== Provenance ===");
  push("Pays", "Nombre", "%");
  for (const item of stats.provenance) {
    push(item.label, item.count, item.percentage.toFixed(1));
  }
  push("");

  // Transmis par
  push("=== Transmis par ===");
  push("Source", "Nombre", "%");
  for (const item of stats.transmitters) {
    push(item.label, item.count, item.percentage.toFixed(1));
  }
  push("");

  // Type de séjour
  push("=== Type de séjour ===");
  push("Type", "Nombre", "%");
  for (const item of stats.typeBreakdown) {
    push(item.label, item.count, item.percentage.toFixed(1));
  }
  push("");

  // Distribution mensuelle (envoi)
  push("=== Distribution mensuelle (envoi) ===");
  push("Mois", "Nombre", "%");
  for (const item of stats.monthlyDistribution) {
    push(item.label, item.count, item.percentage.toFixed(1));
  }
  push("");

  // Distribution mensuelle (séjour)
  push("=== Distribution mensuelle (séjour) ===");
  push("Mois", "Nombre", "%");
  for (const item of stats.stayMonthDistribution) {
    push(item.label, item.count, item.percentage.toFixed(1));
  }

  const csvContent = "\uFEFF" + lines.join("\n"); // BOM for Excel FR
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `stats_offres_${yearLabel(year)}.csv`);
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

export function exportStatsXLSX(
  offers: Offer[],
  stats: OfferStats,
  year: number | null,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1 – Résumé
  const summaryRows: (string | number)[][] = [
    ["Indicateur", "Valeur"],
    ["Total offres", stats.totalOffers],
    ["Avec date d'envoi", stats.offersWithSendDate],
    ["Réponses hôtels", stats.totalHotelResponses],
    [
      "Durée moyenne séjour (nuits)",
      stats.averageStayLength !== null
        ? Number(stats.averageStayLength.toFixed(1))
        : "N/A",
    ],
    [
      "Taille moyenne groupe",
      stats.averageGroupSize !== null
        ? Number(stats.averageGroupSize.toFixed(1))
        : "N/A",
    ],
    ["Confirmées hébergement", stats.confirmedSplit.hebergement],
    ["Confirmées activité uniquement", stats.confirmedSplit.activite],
    [],
    ["=== Provenance ==="],
    ["Pays", "Nombre", "%"],
    ...stats.provenance.map((i) => [
      i.label,
      i.count,
      Number(i.percentage.toFixed(1)),
    ]),
    [],
    ["=== Transmis par ==="],
    ["Source", "Nombre", "%"],
    ...stats.transmitters.map((i) => [
      i.label,
      i.count,
      Number(i.percentage.toFixed(1)),
    ]),
    [],
    ["=== Type de séjour ==="],
    ["Type", "Nombre", "%"],
    ...stats.typeBreakdown.map((i) => [
      i.label,
      i.count,
      Number(i.percentage.toFixed(1)),
    ]),
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Résumé");

  // Sheet 2 – Détail offres
  const detailHeader = [
    "N°",
    "Société",
    "Pays",
    "Type séjour",
    "Statut",
    "Séjour du",
    "Séjour au",
    "Pax",
    "Transmis par",
    "Traité par",
    "Créée le",
  ];

  const detailRows = offers.map((o) => {
    const eff = getEffectiveDates(o);
    return [
      o.numeroOffre ?? "",
      o.societeContact ?? "",
      o.pays ?? "",
      o.typeSejour ?? "",
      getStatutLabel(o.statut),
      eff.du ?? "",
      eff.au ?? "",
      o.nombrePax ?? "",
      o.transmisPar ?? "",
      o.traitePar ?? "",
      o.createdAt ?? "",
    ];
  });

  const ws2 = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  XLSX.utils.book_append_sheet(wb, ws2, "Détail offres");

  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `stats_offres_${yearLabel(year)}.xlsx`);
}
