import type { SharedOfferResponse } from "@/features/offres/api";
import type { Lang } from "@/features/offres/i18n";
import { t, formatDateLocale } from "@/features/offres/i18n";
import { computeNights } from "@/features/offres/utils";

type OfferRequestSummaryProps = {
  offer: SharedOfferResponse;
  lang: Lang;
  showSimple: boolean;
  showDouble: boolean;
  showSeminaire: boolean;
  isActivityOnly: boolean;
};

export function OfferRequestSummary({
  offer,
  lang,
  showSimple,
  showDouble,
  showSeminaire,
  isActivityOnly,
}: OfferRequestSummaryProps) {
  const fl: Lang = "fr";

  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t(fl, "requestSummary")}
      </p>
      <h1 className="mt-2 text-center text-3xl font-semibold text-slate-900">
        {offer.societeContact}
      </h1>

      <div className="mt-6 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
        {offer.typeSejour && (
          <InfoItem label={t(fl, "stayTypeLabel")} value={offer.typeSejour} />
        )}
        {isActivityOnly && (
          <InfoItem label="" value={t(fl, "activityOnly")} className="text-amber-600 font-medium" />
        )}
        {typeof offer.nombrePax === "number" && (
          <InfoItem label={t(fl, "participants")} value={`${offer.nombrePax}`} />
        )}
        {offer.nombreDeNuits && (
          <InfoItem label={t(fl, "nights")} value={offer.nombreDeNuits} />
        )}

        {!isActivityOnly && (showSimple || showDouble || (offer.chambresAutre && offer.chambresAutre > 0)) && (
          <div className="col-span-full">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t(fl, "requestedRooms")}</p>
            <p className="mt-1">
              {[
                showSimple ? `${offer.chambresSimple} ${t(fl, "singleRooms")}` : null,
                showDouble ? `${offer.chambresDouble} ${t(fl, "doubleRooms")}` : null,
                offer.chambresAutre && offer.chambresAutre > 0 ? `${offer.chambresAutre} ${t(fl, "otherRooms")}` : null,
              ].filter(Boolean).join(" / ")}
            </p>
          </div>
        )}

        {showSeminaire && (
          <div className="col-span-full">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t(fl, "seminarInfo")}</p>
            <p className="mt-1">
              {[
                offer.seminaireJournee ? t(fl, "fullDay") : null,
                offer.seminaireDemiJournee ? t(fl, "halfDay") : null,
              ].filter(Boolean).join(" + ") || t(fl, "yes")}
              {offer.seminaireDetails ? ` — ${offer.seminaireDetails}` : ""}
            </p>
          </div>
        )}

        {offer.dateOptions && offer.dateOptions.length > 0 && (
          <div className="col-span-full">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t(fl, "datesRequested")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {offer.dateOptions.map((opt, i) => {
                const n = computeNights(opt.du || null, opt.au || null);
                return (
                  <span key={i} className="rounded-xl bg-slate-100 px-3 py-1 text-sm">
                    {`${formatDateLocale(opt.du, lang)} → ${formatDateLocale(opt.au, lang)}`}
                    {n !== null && (
                      <span className="ml-1.5 text-xs text-slate-500">
                        ({n} {t(fl, "nights")})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function InfoItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      )}
      <p className={className ?? "mt-1"}>{value}</p>
    </div>
  );
}
