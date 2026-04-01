import type { Lang } from "@/features/offres/i18n";
import { t, formatDateLocale } from "@/features/offres/i18n";
import { TemplateField } from "./ShareOfferWidgets";
import { type DateOptionResponse, type PriceUnit, type SeminarUnit, inputClass, chfToEur } from "./share-offer-utils";

type DateResponseSectionProps = {
  dateResponse: DateOptionResponse;
  lang: Lang;
  rate: number;
  showSimple: boolean;
  showDouble: boolean;
  showAutre: boolean;
  autreLabel: string | null;
  requestedRooms: { simple?: number | null; double?: number | null; autre?: number | null };
  showSeminaire: boolean;
  showJournee: boolean;
  showDemiJournee: boolean;
  isActivityOnly: boolean;
  showDemiPension: boolean;
  showPensionComplete: boolean;
  singleDate: boolean;
  seminaireDetails: string | null;
  onUpdate: (patch: Partial<DateOptionResponse>) => void;
};

export function DateResponseSection({
  dateResponse: dr,
  lang,
  rate,
  showSimple,
  showDouble,
  showAutre,
  autreLabel,
  requestedRooms,
  showSeminaire,
  showJournee,
  showDemiJournee,
  isActivityOnly,
  showDemiPension,
  showPensionComplete,
  singleDate,
  seminaireDetails,
  onUpdate,
}: DateResponseSectionProps) {
  const fl: Lang = "fr";
  const roomUnitOpts = [
    { value: "chambre", label: "/ chambre" },
    { value: "personne", label: "/ pers." },
  ];
  const seminarUnitOpts = [
    { value: "personne", label: "/ pers." },
    { value: "salle", label: "/ salle" },
  ];

  const hasRooms = !isActivityOnly && (showSimple || showDouble || showAutre);

  return (
    <section className="space-y-6 rounded-2xl bg-slate-50 p-4">
      {/* Header : dates + fermé */}
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
        <>
          {/* --- Infos --- */}
          <FormSubSection title="Infos">
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
            </div>
          </FormSubSection>

          {/* --- Chambres --- */}
          {hasRooms && (
            <FormSubSection title="Chambres">
              <div className="grid gap-4 md:grid-cols-2">
                {showSimple && (
                  <>
                    <TemplateField
                      label={`${t(fl, "availableRoomsSimple")}${requestedRooms.simple ? ` — ${requestedRooms.simple} demandée${requestedRooms.simple > 1 ? "s" : ""}` : ""}`}
                      value={dr.roomsSimple}
                      onChange={(e) => onUpdate({ roomsSimple: e.target.value })}
                      type="number"
                      min="0"
                    />
                    <ChfField
                      label={t(fl, "priceSingleChf")}
                      value={dr.priceSimpleChf}
                      onChange={(v) => onUpdate({ priceSimpleChf: v })}
                      rate={rate}
                      unitOptions={roomUnitOpts}
                      unit={dr.priceSimpleUnit}
                      onUnitChange={(v) => onUpdate({ priceSimpleUnit: v as PriceUnit })}
                    />
                  </>
                )}
                {showDouble && (
                  <>
                    <TemplateField
                      label={`${t(fl, "availableRoomsDouble")}${requestedRooms.double ? ` — ${requestedRooms.double} demandée${requestedRooms.double > 1 ? "s" : ""}` : ""}`}
                      value={dr.roomsDouble}
                      onChange={(e) => onUpdate({ roomsDouble: e.target.value })}
                      type="number"
                      min="0"
                    />
                    <ChfField
                      label={t(fl, "priceDoubleChf")}
                      value={dr.priceDoubleChf}
                      onChange={(v) => onUpdate({ priceDoubleChf: v })}
                      rate={rate}
                      unitOptions={roomUnitOpts}
                      unit={dr.priceDoubleUnit}
                      onUnitChange={(v) => onUpdate({ priceDoubleUnit: v as PriceUnit })}
                    />
                  </>
                )}
                {showAutre && (
                  <>
                    <TemplateField
                      label={`${autreLabel ? `${t(fl, "availableRoomsAutre")} (${autreLabel})` : t(fl, "availableRoomsAutre")}${requestedRooms.autre ? ` — ${requestedRooms.autre} demandée${requestedRooms.autre > 1 ? "s" : ""}` : ""}`}
                      value={dr.roomsAutre}
                      onChange={(e) => onUpdate({ roomsAutre: e.target.value })}
                      type="number"
                      min="0"
                    />
                    <ChfField
                      label={autreLabel ? `Prix ${autreLabel} (CHF)` : t(fl, "priceAutreChf")}
                      value={dr.priceAutreChf}
                      onChange={(v) => onUpdate({ priceAutreChf: v })}
                      rate={rate}
                      unitOptions={roomUnitOpts}
                      unit={dr.priceAutreUnit}
                      onUnitChange={(v) => onUpdate({ priceAutreUnit: v as PriceUnit })}
                    />
                  </>
                )}
                <ChfField
                  label={t(fl, "touristTaxChf")}
                  value={dr.taxeChf}
                  onChange={(v) => onUpdate({ taxeChf: v })}
                  rate={rate}
                />
                {showDemiPension && (
                  <ChfField
                    label={t(fl, "halfBoardChf")}
                    value={dr.demiPensionChf}
                    onChange={(v) => onUpdate({ demiPensionChf: v })}
                    rate={rate}
                  />
                )}
                {showPensionComplete && (
                  <ChfField
                    label={t(fl, "fullBoardChf")}
                    value={dr.pensionCompleteChf}
                    onChange={(v) => onUpdate({ pensionCompleteChf: v })}
                    rate={rate}
                  />
                )}
              </div>
            </FormSubSection>
          )}

          {/* --- Séminaire --- */}
          {showSeminaire && (
            <FormSubSection title={`Séminaire — ${[showJournee ? t(fl, "fullDay") : null, showDemiJournee ? t(fl, "halfDay") : null].filter(Boolean).join(" + ")}${seminaireDetails ? ` — ${seminaireDetails}` : ""}`}>
              <div className="grid gap-4 md:grid-cols-2">
                {showJournee && (
                  <ChfField
                    label={t(fl, "seminarPackageFullDayChf")}
                    value={dr.forfaitJourneeChf}
                    onChange={(v) => onUpdate({ forfaitJourneeChf: v })}
                    rate={rate}
                    unitOptions={seminarUnitOpts}
                    unit={dr.forfaitJourneeUnit}
                    onUnitChange={(v) => onUpdate({ forfaitJourneeUnit: v as SeminarUnit })}
                  />
                )}
                {showDemiJournee && (
                  <ChfField
                    label={t(fl, "seminarPackageHalfDayChf")}
                    value={dr.forfaitDemiJourneeChf}
                    onChange={(v) => onUpdate({ forfaitDemiJourneeChf: v })}
                    rate={rate}
                    unitOptions={seminarUnitOpts}
                    unit={dr.forfaitDemiJourneeUnit}
                    onUnitChange={(v) => onUpdate({ forfaitDemiJourneeUnit: v as SeminarUnit })}
                  />
                )}
              </div>
            </FormSubSection>
          )}

          {/* --- Commentaire par date --- */}
          {!singleDate && (
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
        </>
      )}
    </section>
  );
}

function FormSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="border-b border-slate-200 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function ChfField({
  label,
  value,
  onChange,
  rate,
  unitOptions,
  unit,
  onUnitChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rate: number;
  unitOptions?: { value: string; label: string }[];
  unit?: string;
  onUnitChange?: (v: string) => void;
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
      <div className="mt-1 flex items-center gap-2">
        {eur && (
          <span className="text-xs text-slate-400">≈ €{eur}</span>
        )}
        {unitOptions && onUnitChange && (
          <span className="ml-auto inline-flex rounded-full bg-slate-100 p-0.5 text-[11px]">
            {unitOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUnitChange(opt.value)}
                className={`rounded-full px-2 py-0.5 transition ${
                  unit === opt.value
                    ? "bg-white text-slate-900 shadow-sm font-medium"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
