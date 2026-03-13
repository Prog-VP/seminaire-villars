"use client";

import type { buildOfferStats } from "../utils";
import { fmtNum } from "./stat-formatters";
import { SectionHeader, HighlightCard, EvolutionCard } from "./StatCards";

type Stats = ReturnType<typeof buildOfferStats>;

type OverviewTabProps = {
  stats: Stats;
  evolution: { prev: Stats; prevYear: number } | null;
  selectedYear: number | null;
};

export function OverviewTab({ stats, evolution, selectedYear }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Offres confirmées */}
      <section>
        <SectionHeader
          title="Offres confirmées"
          description="Répartition des offres confirmées entre hébergement et activité uniquement."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <HighlightCard
            label="Hébergement"
            value={`${stats.confirmedSplit.hebergement}`}
            helperText="Offres confirmées incluant de l'hébergement."
          />
          <HighlightCard
            label="Activité uniquement"
            value={`${stats.confirmedSplit.activite}`}
            helperText="Offres confirmées sans hébergement."
          />
        </div>
      </section>

      {/* Indicateurs clés */}
      <section>
        <SectionHeader
          title="Indicateurs clés"
          description="Durée moyenne des séjours et taille moyenne des groupes."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <HighlightCard
            label="Durée moyenne des séjours"
            value={
              stats.averageStayLength
                ? `${fmtNum(stats.averageStayLength)} nuit${
                    stats.averageStayLength > 1 ? "s" : ""
                  }`
                : "\u2014"
            }
            helperText={
              stats.averageStayLength
                ? "Calculé à partir des nuits renseignées ou des dates de séjour."
                : "Pas assez de données pour l'instant."
            }
          />
          <HighlightCard
            label="Taille moyenne des groupes"
            value={
              stats.averageGroupSize
                ? `${fmtNum(stats.averageGroupSize)} participant${
                    stats.averageGroupSize >= 2 ? "s" : ""
                  }`
                : "\u2014"
            }
            helperText={
              stats.averageGroupSize
                ? "Nombre de participants indiqué dans les offres."
                : "Pas assez de données pour l'instant."
            }
          />
        </div>
      </section>

      {/* Évolutions N vs N-1 */}
      {evolution && (
        <section>
          <SectionHeader
            title={`Évolutions ${selectedYear} vs ${evolution.prevYear}`}
            description="Comparaison avec l'année précédente."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <EvolutionCard
              label="Total offres"
              current={stats.totalOffers}
              previous={evolution.prev.totalOffers}
            />
            <EvolutionCard
              label="Confirmées"
              current={
                stats.confirmedSplit.hebergement +
                stats.confirmedSplit.activite
              }
              previous={
                evolution.prev.confirmedSplit.hebergement +
                evolution.prev.confirmedSplit.activite
              }
            />
            <EvolutionCard
              label="Taille moy. groupe"
              current={stats.averageGroupSize}
              previous={evolution.prev.averageGroupSize}
              formatValue={(v) =>
                v !== null ? fmtNum(v) : "\u2014"
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}
