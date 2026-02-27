import type { Offer } from "@/features/offres/types";
import { buildOfferStats } from "../utils";

type StatsDashboardProps = {
  offers: Offer[];
};

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

export function StatsDashboard({ offers }: StatsDashboardProps) {
  const stats = buildOfferStats(offers);

  if (stats.totalOffers === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
        <p className="text-xl font-semibold text-slate-900">
          Aucune offre disponible
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Créez une première offre pour afficher les statistiques.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-600 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/60">
              Analyse
            </p>
            <h2 className="text-2xl font-semibold">Statistiques des offres</h2>
            <p className="text-sm text-slate-300">
              Basé sur {stats.totalOffers} offre
              {stats.totalOffers > 1 ? "s" : ""} enregistrée
              {stats.totalOffers > 1 ? "s" : ""}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderPill
              label="Offres suivies"
              value={`${stats.totalOffers}`}
            />
            <HeaderPill
              label="Avec date d’envoi"
              value={`${stats.offersWithSendDate}`}
            />
            <HeaderPill
              label="Réponses hôtels"
              value={`${offers.filter((offer) => offer.hotelResponses?.length).length}`}
            />
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <SectionHeader
          title="Provenance des demandes"
          description="Répartition des offres selon le pays indiqué dans l’offre."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {stats.provenance.map((item) => (
            <article
              key={item.label}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.count} offre{item.count > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-xl font-semibold text-slate-900">
                  {formatPercentage(item.percentage)}
                </p>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${clampPercentage(item.percentage)}%`,
                  }}
                  aria-hidden="true"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Indicateurs clés"
          description="Durée moyenne des séjours et taille moyenne des groupes."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <HighlightCard
            label="Durée moyenne des séjours"
            value={
              stats.averageStayLength
                ? `${formatNumber(stats.averageStayLength)} nuit${
                    stats.averageStayLength > 1 ? "s" : ""
                  }`
                : "—"
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
                ? `${formatNumber(stats.averageGroupSize)} participant${
                    stats.averageGroupSize >= 2 ? "s" : ""
                  }`
                : "—"
            }
            helperText={
              stats.averageGroupSize
                ? "Nombre de participants indiqué dans les offres."
                : "Pas assez de données pour l'instant."
            }
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Période d’envoi des offres"
            description={
              stats.offersWithSendDate
                ? `Répartition mensuelle des ${stats.offersWithSendDate} offre${
                    stats.offersWithSendDate > 1 ? "s" : ""
                  } avec date d’envoi.`
                : "Aucune date d’envoi n’est renseignée."
            }
            size="small"
          />
          {stats.monthlyDistribution.length ? (
            <div className="mt-4 space-y-3">
              {stats.monthlyDistribution.map((item) => (
                <div
                  key={item.monthIndex}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                    <span className="capitalize">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {formatPercentage(item.percentage)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {item.count} offre{item.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-slate-900/80"
                      style={{
                        width: `${clampPercentage(item.percentage)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              Ajoutez des dates d’envoi pour visualiser la répartition mensuelle.
            </p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Été vs hiver"
            description="Répartition des offres envoyées en été (mai-nov.) ou en hiver (déc.-avr.), basée sur la date d’envoi."
            size="small"
          />
          {stats.seasonSplit.totalConsidered ? (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SeasonStat
                  label="Été"
                  percentage={stats.seasonSplit.etePercentage}
                  count={stats.seasonSplit.eteCount}
                />
                <SeasonStat
                  label="Hiver"
                  percentage={stats.seasonSplit.hiverPercentage}
                  count={stats.seasonSplit.hiverCount}
                />
              </div>
              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="relative flex h-full" aria-hidden="true">
                  <div
                    className="h-full bg-amber-400"
                    style={{
                      width: `${clampPercentage(stats.seasonSplit.etePercentage)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-slate-900"
                    style={{
                      width: `${clampPercentage(stats.seasonSplit.hiverPercentage)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-slate-300"
                    style={{
                      width: `${clampPercentage(stats.seasonSplit.shoulderPercentage)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                <LegendDot colorClass="bg-amber-400" label="Été" />
                <LegendDot colorClass="bg-slate-900" label="Hiver" />
                <LegendDot colorClass="bg-slate-300" label="Sans date exploitable" />
                {stats.seasonSplit.shoulderCount > 0 && (
                  <span>
                    {stats.seasonSplit.shoulderCount} offre
                    {stats.seasonSplit.shoulderCount > 1 ? "s" : ""} sans date
                    d&apos;envoi exploitable.
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Ajoutez des dates d’envoi pour distinguer les saisons.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  size = "base",
}: {
  title: string;
  description: string;
  size?: "base" | "small";
}) {
  const titleClass =
    size === "small"
      ? "text-lg font-semibold text-slate-900"
      : "text-2xl font-semibold text-slate-900";

  return (
    <div className="space-y-1.5">
      <p className={titleClass}>{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function HighlightCard({
  label,
  value,
  helperText,
}: {
  label: string;
  value: string;
  helperText: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helperText}</p>
    </article>
  );
}

function SeasonStat({
  label,
  percentage,
  count,
}: {
  label: string;
  percentage: number;
  count: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {formatPercentage(percentage)}
      </p>
      <p className="text-xs text-slate-500">
        {count} offre{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
      <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function LegendDot({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </span>
  );
}

function formatPercentage(value: number) {
  return `${numberFormatter.format(value)} %`;
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function clampPercentage(value: number) {
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}
