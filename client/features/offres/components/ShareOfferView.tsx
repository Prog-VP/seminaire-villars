"use client";

import { useMemo, useState } from "react";
import { submitHotelResponse } from "@/features/offres/api";
import { formatDate } from "@/lib/format";
import type { SharedOfferResponse } from "@/features/offres/api";
import type { HotelResponseConfirmation } from "@/features/offres/types";
import { getEffectiveDates, computeNights } from "@/features/offres/utils";
import { ConfirmationPreview, TemplateField } from "./ShareOfferWidgets";
import {
  type TemplateState,
  TEMPLATE_DEFAULTS,
  inputClass,
  buildTemplateMessage,
  isTemplateValid,
  formatDateInput,
} from "./share-offer-utils";

type ShareOfferViewProps = {
  token: string;
  initialData: SharedOfferResponse | null;
};

type FormState = {
  hotelName: string;
  respondentName: string;
};

export function ShareOfferView({ token, initialData }: ShareOfferViewProps) {
  const [offer, setOffer] = useState<SharedOfferResponse | null>(initialData);
  const [form, setForm] = useState<FormState>({
    hotelName: "",
    respondentName: "",
  });
  const [templateValues, setTemplateValues] = useState<TemplateState>(() => {
    const eff = initialData ? getEffectiveDates(initialData) : { du: null, au: null };
    return {
      ...TEMPLATE_DEFAULTS,
      ...(eff.du ? { dateFrom: formatDateInput(eff.du) } : {}),
      ...(eff.au ? { dateTo: formatDateInput(eff.au) } : {}),
    };
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<HotelResponseConfirmation | null>(null);

  const staySummary = useMemo(() => {
    if (!offer) return "";
    const eff = getEffectiveDates(offer);
    const dates = [eff.du, eff.au]
      .filter(Boolean)
      .map((value) => formatDate(value as string))
      .join(" → ");
    const nightsCount = computeNights(eff.du, eff.au);
    const nights = nightsCount !== null ? `${nightsCount} nuit(s)` : null;
    const pax = typeof offer.nombrePax === "number" ? `${offer.nombrePax} pers.` : null;
    const optionsCount =
      (offer.dateOptions?.length ?? 0) > 1
        ? `${offer.dateOptions!.length} options de dates`
        : null;
    return [dates, optionsCount, nights, pax].filter(Boolean).join(" · ");
  }, [offer]);

  const previewMessage = useMemo(() => buildTemplateMessage(templateValues), [templateValues]);

  if (!offer) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
        <p>Ce lien n&apos;est plus valide. Contactez l&apos;organisateur pour recevoir une nouvelle demande.</p>
      </section>
    );
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTemplateValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.hotelName.trim()) {
      setStatus({ type: "error", message: "Merci d&apos;indiquer le nom de votre hôtel." });
      return;
    }

    if (!isTemplateValid(templateValues)) {
      setStatus({
        type: "error",
        message: "Merci de compléter les valeurs demandées (chiffres ou dates).",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitHotelResponse(token, {
        hotelName: form.hotelName.trim(),
        respondentName: form.respondentName.trim() || undefined,
        message: previewMessage,
        wantsConfirmation: true,
      });
      setOffer((prev) =>
        prev
          ? {
            ...prev,
            hotelResponses: response.hotelResponses,
          }
          : prev
      );
      setForm({ hotelName: "", respondentName: "" });
      const effReset = offer ? getEffectiveDates(offer) : { du: null, au: null };
      setTemplateValues({
        ...TEMPLATE_DEFAULTS,
        ...(effReset.du ? { dateFrom: formatDateInput(effReset.du) } : {}),
        ...(effReset.au ? { dateTo: formatDateInput(effReset.au) } : {}),
      });
      // Fire-and-forget notification
      fetch("/api/notify-hotel-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          hotelName: form.hotelName.trim(),
          respondentName: form.respondentName.trim() || undefined,
          message: previewMessage,
        }),
      }).catch(() => {});

      setConfirmation(response.confirmation ?? null);
      setStatus({ type: "success", message: "Merci, votre réponse a bien été envoyée." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d&apos;enregistrer votre réponse pour le moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      {!confirmation && (
        <header className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Demande reçue
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {offer.societeContact}
          </h1>
          {staySummary && (
            <p className="mt-2 text-sm text-slate-600">{staySummary}</p>
          )}
        </header>
      )}

      {confirmation ? (
        <div className="space-y-4">
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Merci, votre réponse a bien été envoyée.
          </p>
          <ConfirmationPreview confirmation={confirmation} />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nom de l&apos;hôtel
              <input
                name="hotelName"
                value={form.hotelName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Votre nom
              <input
                name="respondentName"
                value={form.respondentName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Contact dans l&apos;hôtel"
              />
            </label>
          </div>

          <section className="space-y-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Votre réponse (remplissez uniquement les champs ci-dessous)
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <TemplateField
                label="Dates - arrivée"
                name="dateFrom"
                value={templateValues.dateFrom}
                onChange={handleTemplateChange}
                type="date"
              />
              <TemplateField
                label="Dates - départ"
                name="dateTo"
                value={templateValues.dateTo}
                onChange={handleTemplateChange}
                type="date"
              />
              <TemplateField
                label="Chambres simples (nombre)"
                name="roomsSimple"
                value={templateValues.roomsSimple}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Chambres doubles (nombre)"
                name="roomsDouble"
                value={templateValues.roomsDouble}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Prix nuitée CHF"
                name="priceChf"
                value={templateValues.priceChf}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Prix nuitée €"
                name="priceEur"
                value={templateValues.priceEur}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Forfait séminaire CHF"
                name="forfaitChf"
                value={templateValues.forfaitChf}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Forfait séminaire €"
                name="forfaitEur"
                value={templateValues.forfaitEur}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Taxe de séjour CHF"
                name="taxeChf"
                value={templateValues.taxeChf}
                onChange={handleTemplateChange}
              />
              <TemplateField
                label="Taxe de séjour €"
                name="taxeEur"
                value={templateValues.taxeEur}
                onChange={handleTemplateChange}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aperçu envoyé
                <textarea
                  readOnly
                  className={`${inputClass} min-h-[160px] bg-white`}
                  value={previewMessage}
                />
              </label>
            </div>
          </section>

          {status && (
            <p
              className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Envoi en cours…" : "Envoyer la réponse"}
          </button>
        </form>
      )}

    </section>
  );
}
