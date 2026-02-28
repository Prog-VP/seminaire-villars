"use client";

import { useMemo, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { submitHotelResponse } from "@/features/offres/api";
import type { SharedOfferResponse } from "@/features/offres/api";
import type { HotelResponseConfirmation } from "@/features/offres/types";

type ShareOfferViewProps = {
  token: string;
  initialData: SharedOfferResponse | null;
};

type FormState = {
  hotelName: string;
  respondentName: string;
};

const inputClass =
  "mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200";

type TemplateState = {
  dateFrom: string;
  dateTo: string;
  roomsSimple: string;
  roomsDouble: string;
  priceChf: string;
  priceEur: string;
  forfaitChf: string;
  forfaitEur: string;
  taxeChf: string;
  taxeEur: string;
};

const TEMPLATE_DEFAULTS: TemplateState = {
  dateFrom: "",
  dateTo: "",
  roomsSimple: "",
  roomsDouble: "",
  priceChf: "",
  priceEur: "",
  forfaitChf: "",
  forfaitEur: "",
  taxeChf: "",
  taxeEur: "",
};

export function ShareOfferView({ token, initialData }: ShareOfferViewProps) {
  const [offer, setOffer] = useState<SharedOfferResponse | null>(initialData);
  const [form, setForm] = useState<FormState>({
    hotelName: "",
    respondentName: "",
  });
  const [templateValues, setTemplateValues] = useState<TemplateState>(() => ({
    ...TEMPLATE_DEFAULTS,
    ...(initialData?.sejourDu
      ? { dateFrom: formatDateInput(initialData.sejourDu) }
      : {}),
    ...(initialData?.sejourAu
      ? { dateTo: formatDateInput(initialData.sejourAu) }
      : {}),
  }));
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<HotelResponseConfirmation | null>(null);

  const staySummary = useMemo(() => {
    if (!offer) return "";
    const dates = [offer.sejourDu, offer.sejourAu]
      .filter(Boolean)
      .map((value) => formatDate(value as string))
      .join(" → ");
    const nights = offer.nombreDeNuits ? `${offer.nombreDeNuits} nuit(s)` : null;
    const pax = typeof offer.nombrePax === "number" ? `${offer.nombrePax} pers.` : null;
    return [dates, nights, pax].filter(Boolean).join(" · ");
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
      setTemplateValues({
        ...TEMPLATE_DEFAULTS,
        ...(offer?.sejourDu ? { dateFrom: formatDateInput(offer.sejourDu) } : {}),
        ...(offer?.sejourAu ? { dateTo: formatDateInput(offer.sejourAu) } : {}),
      });
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

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function buildTemplateMessage(values: TemplateState) {
  const arrival = formatTemplateDate(values.dateFrom);
  const departure = formatTemplateDate(values.dateTo);
  return [
    `Dates disponibles du ${arrival} au ${departure}`,
    `Chambres disponibles : ${values.roomsSimple} chambres simples / ${values.roomsDouble} doubles`,
    `CHF ${values.priceChf} (€ ${values.priceEur}) par nuit en chambre (simple / double) avec petit-déjeuner (parking inclus)`,
    `Forfait séminaire : CHF ${values.forfaitChf} (€ ${values.forfaitEur}) par personne et par jour`,
    `Taxe de séjour : CHF ${values.taxeChf} (€ ${values.taxeEur}) par personne et par nuit`,
  ].join("\n");
}

function isTemplateValid(values: TemplateState) {
  return (
    values.dateFrom.trim().length > 0 &&
    values.dateTo.trim().length > 0 &&
    values.roomsSimple.trim().length > 0 &&
    values.roomsDouble.trim().length > 0 &&
    values.priceChf.trim().length > 0 &&
    values.priceEur.trim().length > 0 &&
    values.forfaitChf.trim().length > 0 &&
    values.forfaitEur.trim().length > 0 &&
    values.taxeChf.trim().length > 0 &&
    values.taxeEur.trim().length > 0
  );
}

function formatTemplateDate(value: string) {
  if (!value) return "…";
  try {
    return new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function ConfirmationPreview({
  confirmation,
}: {
  confirmation: HotelResponseConfirmation;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="rounded-2xl bg-gradient-to-r from-brand-900 to-brand-500 p-6 text-white shadow-inner">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Confirmation envoyée
        </p>
        <h2 className="mt-2 text-3xl font-semibold">{confirmation.hotel}</h2>
        <p className="mt-1 text-sm text-white/80">
          Réponse transmise le {formatDate(confirmation.submittedAt)}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoCard
          title="Informations client"
          items={[
            { label: "Client", value: confirmation.client },
            {
              label: "Séjour",
              value: `${confirmation.stay.from} au ${confirmation.stay.to}`,
            },
            {
              label: "Participants",
              value:
                typeof confirmation.participants === "number"
                  ? `${confirmation.participants} personnes`
                  : "Non précisé",
            },
          ]}
        />
        <InfoCard
          title="Détails de l'hôtel"
          items={[
            { label: "Hôtel", value: confirmation.hotel },
            { label: "Contact", value: confirmation.contact || "Non communiqué" },
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Réponse détaillée
        </p>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-800">
          {confirmation.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        Imprimer cette confirmation
      </button>
    </section>
  );
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p>{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplateField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input className={inputClass} {...props} />
    </label>
  );
}
