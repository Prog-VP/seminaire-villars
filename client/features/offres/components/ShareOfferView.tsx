"use client";

import { useMemo, useState } from "react";
import { submitHotelResponse } from "@/features/offres/api";
import type { SharedOfferResponse } from "@/features/offres/api";
import type { HotelResponseConfirmation } from "@/features/offres/types";
import type { Lang } from "@/features/offres/i18n";
import { t } from "@/features/offres/i18n";
import { ConfirmationPreview } from "./ShareOfferWidgets";
import {
  type TemplateState,
  type DateOptionResponse,
  inputClass,
  buildTemplateMessage,
  isTemplateValid,
  createTemplateDefaults,
  detectLang,
} from "./share-offer-utils";
import { OfferRequestSummary } from "./OfferRequestSummary";
import { DateResponseSection } from "./DateResponseSection";

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
  const fl: Lang = "fr";
  const rate = chfEurRate;

  const showSimple = !!(initialData?.chambresSimple && initialData.chambresSimple > 0);
  const showDouble = !!(initialData?.chambresDouble && initialData.chambresDouble > 0);
  const showAutre = !!(initialData?.chambresAutre && initialData.chambresAutre > 0);
  const autreLabel = initialData?.chambresAutrePrecision || null;
  const showSeminaire = !!(initialData?.seminaireJournee || initialData?.seminaireDemiJournee);
  const showJournee = !!initialData?.seminaireJournee;
  const showDemiJournee = !!initialData?.seminaireDemiJournee;
  const showDemiPension = !!initialData?.demiPension;
  const showPensionComplete = !!initialData?.pensionComplete;
  const isActivityOnly = !!initialData?.activiteUniquement;

  const [offer] = useState<SharedOfferResponse | null>(initialData);
  const [form, setForm] = useState<FormState>({ hotelName: "", respondentName: "" });
  const [templateValues, setTemplateValues] = useState<TemplateState>(() =>
    createTemplateDefaults(
      initialData?.dateOptions,
      initialData?.dateConfirmeeDu,
      initialData?.dateConfirmeeAu,
      { chambresSimple: initialData?.chambresSimple, chambresDouble: initialData?.chambresDouble, chambresAutre: initialData?.chambresAutre  },
    )
  );
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<HotelResponseConfirmation | null>(null);
  const [previewEditable, setPreviewEditable] = useState(false);
  const [editedPreview, setEditedPreview] = useState<string | null>(null);

  const requestedRooms = useMemo(() => ({
    simple: initialData?.chambresSimple,
    double: initialData?.chambresDouble,
    autre: initialData?.chambresAutre,
  }), [initialData?.chambresSimple, initialData?.chambresDouble, initialData?.chambresAutre]);

  const messageOpts = useMemo(() => ({
    showSimple,
    showDouble,
    showAutre,
    autreLabel,
    requestedRooms,
    showSeminaire,
    showJournee: showJournee,
    showDemiJournee,
    activiteUniquement: isActivityOnly,
    showDemiPension,
    showPensionComplete,
  }), [showSimple, showDouble, showAutre, autreLabel, requestedRooms, showSeminaire, showJournee, showDemiJournee, isActivityOnly, showDemiPension, showPensionComplete]);

  const previewMessage = useMemo(
    () => buildTemplateMessage(templateValues, lang, rate, messageOpts),
    [templateValues, lang, rate, messageOpts]
  );

  const finalMessage = editedPreview ?? previewMessage;

  if (!offer) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
        <p>{t(fl, "linkExpired")}</p>
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
      setStatus({ type: "error", message: t(fl, "errorHotelName") });
      return;
    }
    if (!isTemplateValid(templateValues)) {
      setStatus({ type: "error", message: t(fl, "errorFields") });
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
      setStatus({ type: "success", message: t(fl, "thankYou") });
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
        <OfferRequestSummary
          offer={offer}
          lang={lang}
          isActivityOnly={isActivityOnly}
        />
      )}

      {confirmation ? (
        <div className="space-y-4">
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {t(fl, "thankYou")}
          </p>
          <ConfirmationPreview
            confirmation={confirmation}
            dateOptions={offer.dateOptions}
            dateResponses={templateValues.dateResponses}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">{t(fl, "hotelFormTitle")}</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(fl, "hotelName")}
              <input name="hotelName" value={form.hotelName} onChange={handleChange} className={inputClass} required />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(fl, "contactName")}
              <input name="respondentName" value={form.respondentName} onChange={handleChange} className={inputClass} />
            </label>
          </div>

          {hasTabs && (
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {dateResponses.map((dr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    activeTab === i ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t(fl, "dateOption")} {i + 1}
                  {!dr.disponible && <span className="ml-1 text-rose-500">✕</span>}
                </button>
              ))}
            </div>
          )}

          <DateResponseSection
            dateResponse={currentDr}
            lang={lang}
            rate={rate}
            showSimple={showSimple}
            showDouble={showDouble}
            showAutre={showAutre}
            autreLabel={autreLabel}
            requestedRooms={requestedRooms}
            showSeminaire={showSeminaire}
            showJournee={showJournee}
            showDemiJournee={showDemiJournee}
            isActivityOnly={isActivityOnly}
            showDemiPension={showDemiPension}
            showPensionComplete={showPensionComplete}
            singleDate={!hasTabs}
            seminaireDetails={initialData?.seminaireDetails ?? null}
            onUpdate={(patch) => updateDateResponse(activeTab, patch)}
          />

          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(fl, "generalComment")}
            <textarea
              value={templateValues.commentaireGeneral}
              onChange={(e) => updateGlobal({ commentaireGeneral: e.target.value })}
              className={`${inputClass} min-h-[60px]`}
              rows={2}
            />
          </label>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(fl, "previewTitle")}</p>
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
                {previewEditable ? t(fl, "lockPreview") : t(fl, "editPreview")}
              </button>
            </div>
            <textarea
              readOnly={!previewEditable}
              value={previewEditable ? (editedPreview ?? previewMessage) : previewMessage}
              onChange={(e) => setEditedPreview(e.target.value)}
              className={`${inputClass} min-h-[360px] ${previewEditable ? "bg-white" : "bg-slate-50"}`}
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
            {isSubmitting ? t(fl, "submitting") : t(fl, "submitResponse")}
          </button>
        </form>
      )}
    </section>
  );
}
