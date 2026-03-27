import type { Lang } from "@/features/offres/i18n";
import { t, formatDateLocale } from "@/features/offres/i18n";
import { TemplateField } from "./ShareOfferWidgets";
import { type DateOptionResponse, inputClass, chfToEur } from "./share-offer-utils";

type DateResponseSectionProps = {
  dateResponse: DateOptionResponse;
  lang: Lang;
  rate: number;
  showSimple: boolean;
  showDouble: boolean;
  showSeminaire: boolean;
  showJournee: boolean;
  showDemiJournee: boolean;
  isActivityOnly: boolean;
  onUpdate: (patch: Partial<DateOptionResponse>) => void;
};

export function DateResponseSection({
  dateResponse: dr,
  lang,
  rate,
  showSimple,
  showDouble,
  showSeminaire,
  showJournee,
  showDemiJournee,
  isActivityOnly,
  onUpdate,
}: DateResponseSectionProps) {
  const fl: Lang = "fr";

  return (
    <section className="space-y-4 rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          {dr.dateFrom && dr.dateTo
            ? `${formatDateLocale(dr.dateFrom, lang)} → ${formatDateLocale(dr.dateTo, lang)}`
            : t(fl, "dateOption")}
        </span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!dr.disponible}
            onChange={(e) => onUpdate({ disponible: !e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className={dr.disponible ? "text-slate-500" : "font-medium text-rose-600"}>
            {t(fl, "closed")}
          </span>
        </label>
      </div>

      {dr.disponible && (
        <div className="grid gap-4 md:grid-cols-2">
          <TemplateField
            label={t(fl, "availableDates") + " — " + t(fl, "stayDates").toLowerCase().split(" ")[0]}
            name="dateFrom"
            value={dr.dateFrom}
            onChange={(e) => onUpdate({ dateFrom: e.target.value })}
            type="date"
          />
          <TemplateField
            label={t(fl, "availableDates") + " — départ"}
            name="dateTo"
            value={dr.dateTo}
            onChange={(e) => onUpdate({ dateTo: e.target.value })}
            type="date"
          />

          {!isActivityOnly && (
            <>
              {showSimple && (
                <TemplateField
                  label={t(fl, "availableRoomsSimple")}
                  value={dr.roomsSimple}
                  onChange={(e) => onUpdate({ roomsSimple: e.target.value })}
                  type="number"
                  min="0"
                />
              )}
              {showDouble && (
                <TemplateField
                  label={t(fl, "availableRoomsDouble")}
                  value={dr.roomsDouble}
                  onChange={(e) => onUpdate({ roomsDouble: e.target.value })}
                  type="number"
                  min="0"
                />
              )}
              {showSimple && (
                <ChfField
                  label={t(fl, "priceSingleChf")}
                  value={dr.priceSimpleChf}
                  onChange={(v) => onUpdate({ priceSimpleChf: v })}
                  rate={rate}
                />
              )}
              {showDouble && (
                <ChfField
                  label={t(fl, "priceDoubleChf")}
                  value={dr.priceDoubleChf}
                  onChange={(v) => onUpdate({ priceDoubleChf: v })}
                  rate={rate}
                />
              )}
              <ChfField
                label={t(fl, "halfBoardChf")}
                value={dr.demiPensionChf}
                onChange={(v) => onUpdate({ demiPensionChf: v })}
                rate={rate}
              />
              <ChfField
                label={t(fl, "fullBoardChf")}
                value={dr.pensionCompleteChf}
                onChange={(v) => onUpdate({ pensionCompleteChf: v })}
                rate={rate}
              />
            </>
          )}

          {showSeminaire && (showJournee || (!showJournee && !showDemiJournee)) && (
            <ChfField
              label={showDemiJournee ? t(fl, "seminarPackageFullDayChf") : t(fl, "seminarPackageChf")}
              value={dr.forfaitJourneeChf}
              onChange={(v) => onUpdate({ forfaitJourneeChf: v })}
              rate={rate}
            />
          )}
          {showSeminaire && showDemiJournee && (
            <ChfField
              label={showJournee ? t(fl, "seminarPackageHalfDayChf") : t(fl, "seminarPackageChf")}
              value={dr.forfaitDemiJourneeChf}
              onChange={(v) => onUpdate({ forfaitDemiJourneeChf: v })}
              rate={rate}
            />
          )}

          <ChfField
            label={t(fl, "touristTaxChf")}
            value={dr.taxeChf}
            onChange={(v) => onUpdate({ taxeChf: v })}
            rate={rate}
          />
        </div>
      )}

      {dr.disponible && (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t(fl, "commentPerDate")}
          <textarea
            value={dr.commentaire}
            onChange={(e) => onUpdate({ commentaire: e.target.value })}
            className={`${inputClass} min-h-[60px]`}
            rows={2}
          />
        </label>
      )}
    </section>
  );
}

function ChfField({
  label,
  value,
  onChange,
  rate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rate: number;
}) {
  const eur = chfToEur(value, rate);
  return (
    <div>
      <TemplateField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        step="0.01"
        min="0"
      />
      {eur && (
        <p className="mt-1 text-xs text-slate-400">≈ €{eur}</p>
      )}
    </div>
  );
}
