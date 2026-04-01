import type { SharedOfferResponse } from "@/features/offres/api";
import type { Lang } from "@/features/offres/i18n";
import { t, formatDateLocale } from "@/features/offres/i18n";
import { computeNights } from "@/features/offres/utils";

type OfferRequestSummaryProps = {
  offer: SharedOfferResponse;
  lang: Lang;
  isActivityOnly: boolean;
};

export function OfferRequestSummary({
  offer,
  lang,
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

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-700">
        {typeof offer.nombrePax === "number" && (
          <span>{t(fl, "participants")} : <strong>{offer.nombrePax}</strong></span>
        )}
        {offer.nombreDeNuits && (
          <span>{t(fl, "nights")} : <strong>{offer.nombreDeNuits}</strong></span>
        )}
        {isActivityOnly && (
          <span className="font-medium text-amber-600">{t(fl, "activityOnly")}</span>
        )}
        {(offer.demiPension || offer.pensionComplete) && (
          <span>
            Pension : <strong>
              {[
                offer.demiPension ? "Demi-pension" : null,
                offer.pensionComplete ? "Pension complète" : null,
              ].filter(Boolean).join(" + ")}
            </strong>
          </span>
        )}
      </div>

      {offer.dateOptions && offer.dateOptions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
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
      )}
    </header>
  );
}
