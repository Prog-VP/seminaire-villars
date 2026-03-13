"use client";

import { useMemo, useState } from "react";
import { submitHotelResponse } from "@/features/offres/api";
import type { SharedOfferResponse } from "@/features/offres/api";
import type { HotelResponseConfirmation } from "@/features/offres/types";
import type { Lang } from "@/features/offres/i18n";
import { t, formatDateLocale } from "@/features/offres/i18n";
import { ConfirmationPreview, TemplateField } from "./ShareOfferWidgets";
import {
  type TemplateState,
  type DateOptionResponse,
  inputClass,
  buildTemplateMessage,
  isTemplateValid,
  createTemplateDefaults,
  chfToEur,
  detectLang,
} from "./share-offer-utils";

type ShareOfferViewProps = {
  token: string;
  initialData: SharedOfferResponse | null;
  chfEurRate: number;
};

type FormState = {
  hotelName: string;
  respondentName: string;
};

export function ShareOfferView({ token, initialData, chfEurRate }: ShareOfferViewProps) {
  const lang: Lang = detectLang(initialData?.langue);
  const rate = chfEurRate;

  const showSimple = !!(initialData?.chambresSimple && initialData.chambresSimple > 0);
  const showDouble = !!(initialData?.chambresDouble && initialData.chambresDouble > 0);
  const showSeminaire = !!initialData?.seminaire;
  const isActivityOnly = !!initialData?.activiteUniquement;

  const [offer] = useState<SharedOfferResponse | null>(initialData);
  const [form, setForm] = useState<FormState>({ hotelName: "", respondentName: "" });
  const [templateValues, setTemplateValues] = useState<TemplateState>(() =>
    createTemplateDefaults(initialData?.dateOptions, initialData?.dateConfirmeeDu, initialData?.dateConfirmeeAu)
  );
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<HotelResponseConfirmation | null>(null);
  const [previewEditable, setPreviewEditable] = useState(false);
  const [editedPreview, setEditedPreview] = useState<string | null>(null);

  const messageOpts = useMemo(() => ({
    showSimple,
    showDouble,
    showSeminaire,
    activiteUniquement: isActivityOnly,
  }), [showSimple, showDouble, showSeminaire, isActivityOnly]);

  const previewMessage = useMemo(
    () => buildTemplateMessage(templateValues, lang, rate, messageOpts),
    [templateValues, lang, rate, messageOpts]
  );

  const finalMessage = editedPreview ?? previewMessage;

  if (!offer) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
        <p>{t(lang, "linkExpired")}</p>
      </section>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateDateResponse = (index: number, patch: Partial<DateOptionResponse>) => {
    setTemplateValues((prev) => ({
      ...prev,
      dateResponses: prev.dateResponses.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));
    setEditedPreview(null);
  };

  const updateGlobal = (patch: Partial<TemplateState>) => {
    setTemplateValues((prev) => ({ ...prev, ...patch }));
    setEditedPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.hotelName.trim()) {
      setStatus({ type: "error", message: t(lang, "errorHotelName") });
      return;
    }
    if (!isTemplateValid(templateValues)) {
      setStatus({ type: "error", message: t(lang, "errorFields") });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitHotelResponse(token, {
        hotelName: form.hotelName.trim(),
        respondentName: form.respondentName.trim() || undefined,
        message: finalMessage,
        wantsConfirmation: true,
      });

      fetch("/api/notify-hotel-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          hotelName: form.hotelName.trim(),
          respondentName: form.respondentName.trim() || undefined,
          message: finalMessage,
        }),
      }).catch(() => {});

      setConfirmation(response.confirmation ?? null);
      setStatus({ type: "success", message: t(lang, "thankYou") });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateResponses = templateValues.dateResponses;
  const hasTabs = dateResponses.length > 1;
  const currentDr = dateResponses[activeTab];

  return (
    <section className="space-y-6">
      {!confirmation && (
        <>
          {/* Header with request info */}
          <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(lang, "requestSummary")}
            </p>
            <h1 className="mt-2 text-center text-3xl font-semibold text-slate-900">
              {offer.societeContact}
            </h1>

            <div className="mt-6 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
              {offer.typeSejour && (
                <InfoItem label={t(lang, "stayTypeLabel")} value={offer.typeSejour} />
              )}
              {isActivityOnly && (
                <InfoItem label="" value={t(lang, "activityOnly")} className="text-amber-600 font-medium" />
              )}
              {typeof offer.nombrePax === "number" && (
                <InfoItem label={t(lang, "participants")} value={`${offer.nombrePax}`} />
              )}
              {offer.nombreDeNuits && (
                <InfoItem label={t(lang, "nights")} value={offer.nombreDeNuits} />
              )}

              {/* Rooms requested */}
              {!isActivityOnly && (showSimple || showDouble || (offer.chambresAutre && offer.chambresAutre > 0)) && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t(lang, "requestedRooms")}</p>
                  <p className="mt-1">
                    {[
                      showSimple ? `${offer.chambresSimple} ${t(lang, "singleRooms")}` : null,
                      showDouble ? `${offer.chambresDouble} ${t(lang, "doubleRooms")}` : null,
                      offer.chambresAutre && offer.chambresAutre > 0 ? `${offer.chambresAutre} ${t(lang, "otherRooms")}` : null,
                    ].filter(Boolean).join(" / ")}
                  </p>
                </div>
              )}

              {/* Seminar info */}
              {showSeminaire && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t(lang, "seminarInfo")}</p>
                  <p className="mt-1">
                    {[
                      offer.seminaireJournee ? t(lang, "fullDay") : null,
                      offer.seminaireDemiJournee ? t(lang, "halfDay") : null,
                    ].filter(Boolean).join(" + ") || t(lang, "yes")}
                    {offer.seminaireDetails ? ` — ${offer.seminaireDetails}` : ""}
                  </p>
                </div>
              )}

              {/* Dates requested */}
              {offer.dateOptions && offer.dateOptions.length > 0 && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t(lang, "datesRequested")}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {offer.dateOptions.map((opt, i) => (
                      <span key={i} className="rounded-xl bg-slate-100 px-3 py-1 text-sm">
                        {formatDateLocale(opt.du, lang)} → {formatDateLocale(opt.au, lang)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>
        </>
      )}

      {confirmation ? (
        <div className="space-y-4">
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {t(lang, "thankYou")}
          </p>
          <ConfirmationPreview confirmation={confirmation} />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">{t(lang, "hotelFormTitle")}</h2>

          {/* Hotel name + contact */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(lang, "hotelName")}
              <input
                name="hotelName"
                value={form.hotelName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(lang, "contactName")}
              <input
                name="respondentName"
                value={form.respondentName}
                onChange={handleChange}
                className={inputClass}
              />
            </label>
          </div>

          {/* Global fields: rooms available */}
          {!isActivityOnly && (
            <div className="grid gap-4 md:grid-cols-2">
              {showSimple && (
                <TemplateField
                  label={t(lang, "availableRoomsSimple")}
                  value={templateValues.roomsSimple}
                  onChange={(e) => updateGlobal({ roomsSimple: e.target.value })}
                  type="number"
                  min="0"
                />
              )}
              {showDouble && (
                <TemplateField
                  label={t(lang, "availableRoomsDouble")}
                  value={templateValues.roomsDouble}
                  onChange={(e) => updateGlobal({ roomsDouble: e.target.value })}
                  type="number"
                  min="0"
                />
              )}
            </div>
          )}

          {/* Seminar type selector */}
          {showSeminaire && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t(lang, "seminarType")}
              </p>
              <div className="mt-1 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="forfaitType"
                    checked={templateValues.forfaitType === "journee"}
                    onChange={() => updateGlobal({ forfaitType: "journee" })}
                  />
                  {t(lang, "fullDay")}
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="forfaitType"
                    checked={templateValues.forfaitType === "demi-journee"}
                    onChange={() => updateGlobal({ forfaitType: "demi-journee" })}
                  />
                  {t(lang, "halfDay")}
                </label>
              </div>
            </div>
          )}

          {/* Tabs for date options */}
          {hasTabs && (
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {dateResponses.map((dr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    activeTab === i
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t(lang, "dateOption")} {i + 1}
                  {!dr.disponible && (
                    <span className="ml-1 text-rose-500">✕</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Per-date fields */}
          <section className="space-y-4 rounded-2xl bg-slate-50 p-4">
            {/* Disponible toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {currentDr.dateFrom && currentDr.dateTo
                  ? `${formatDateLocale(currentDr.dateFrom, lang)} → ${formatDateLocale(currentDr.dateTo, lang)}`
                  : t(lang, "dateOption")}
              </span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!currentDr.disponible}
                  onChange={(e) => updateDateResponse(activeTab, { disponible: !e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className={currentDr.disponible ? "text-slate-500" : "font-medium text-rose-600"}>
                  {t(lang, "closed")}
                </span>
              </label>
            </div>

            {currentDr.disponible && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Dates */}
                <TemplateField
                  label={t(lang, "availableDates") + " — " + t(lang, "stayDates").toLowerCase().split(" ")[0]}
                  name="dateFrom"
                  value={currentDr.dateFrom}
                  onChange={(e) => updateDateResponse(activeTab, { dateFrom: e.target.value })}
                  type="date"
                />
                <TemplateField
                  label={t(lang, "availableDates") + " — " + (lang === "fr" ? "départ" : lang === "de" ? "Abreise" : "departure")}
                  name="dateTo"
                  value={currentDr.dateTo}
                  onChange={(e) => updateDateResponse(activeTab, { dateTo: e.target.value })}
                  type="date"
                />

                {/* Prices — hidden if activiteUniquement */}
                {!isActivityOnly && (
                  <>
                    {showSimple && (
                      <ChfField
                        label={t(lang, "priceSingleChf")}
                        value={currentDr.priceSimpleChf}
                        onChange={(v) => updateDateResponse(activeTab, { priceSimpleChf: v })}
                        rate={rate}
                      />
                    )}
                    {showDouble && (
                      <ChfField
                        label={t(lang, "priceDoubleChf")}
                        value={currentDr.priceDoubleChf}
                        onChange={(v) => updateDateResponse(activeTab, { priceDoubleChf: v })}
                        rate={rate}
                      />
                    )}
                    <ChfField
                      label={t(lang, "halfBoardChf")}
                      value={currentDr.demiPensionChf}
                      onChange={(v) => updateDateResponse(activeTab, { demiPensionChf: v })}
                      rate={rate}
                    />
                    <ChfField
                      label={t(lang, "fullBoardChf")}
                      value={currentDr.pensionCompleteChf}
                      onChange={(v) => updateDateResponse(activeTab, { pensionCompleteChf: v })}
                      rate={rate}
                    />
                  </>
                )}

                {/* Seminar package */}
                {showSeminaire && (
                  <ChfField
                    label={t(lang, "seminarPackageChf")}
                    value={currentDr.forfaitSeminaireChf}
                    onChange={(v) => updateDateResponse(activeTab, { forfaitSeminaireChf: v })}
                    rate={rate}
                  />
                )}

                {/* Tourist tax */}
                <ChfField
                  label={t(lang, "touristTaxChf")}
                  value={currentDr.taxeChf}
                  onChange={(v) => updateDateResponse(activeTab, { taxeChf: v })}
                  rate={rate}
                />
              </div>
            )}

            {/* Comment per date */}
            {currentDr.disponible && (
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t(lang, "commentPerDate")}
                <textarea
                  value={currentDr.commentaire}
                  onChange={(e) => updateDateResponse(activeTab, { commentaire: e.target.value })}
                  className={`${inputClass} min-h-[60px]`}
                  rows={2}
                />
              </label>
            )}
          </section>

          {/* General comment */}
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(lang, "generalComment")}
            <textarea
              value={templateValues.commentaireGeneral}
              onChange={(e) => updateGlobal({ commentaireGeneral: e.target.value })}
              className={`${inputClass} min-h-[60px]`}
              rows={2}
            />
          </label>

          {/* Preview */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t(lang, "previewTitle")}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (previewEditable) {
                    setPreviewEditable(false);
                  } else {
                    setEditedPreview(previewMessage);
                    setPreviewEditable(true);
                  }
                }}
                className="text-xs font-medium text-brand-700 hover:text-brand-900"
              >
                {previewEditable ? t(lang, "lockPreview") : t(lang, "editPreview")}
              </button>
            </div>
            <textarea
              readOnly={!previewEditable}
              value={previewEditable ? (editedPreview ?? previewMessage) : previewMessage}
              onChange={(e) => setEditedPreview(e.target.value)}
              className={`${inputClass} min-h-[160px] ${previewEditable ? "bg-white" : "bg-slate-50"}`}
            />
          </section>

          {status && (
            <p className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t(lang, "submitting") : t(lang, "submitResponse")}
          </button>
        </form>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Internal components
// ---------------------------------------------------------------------------

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
