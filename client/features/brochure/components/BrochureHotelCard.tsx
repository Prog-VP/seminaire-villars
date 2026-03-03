"use client";

import type { BrochureSection } from "../types";
import { brochureImageUrl } from "../utils";

type Props = {
  section: BrochureSection;
};

export function BrochureHotelCard({ section }: Props) {
  const meta = section.metadata;
  const responseData = meta?.hotelResponseData;
  const heroImage = section.images?.[0];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:break-inside-avoid print:shadow-none print:border-slate-300">
      {heroImage && (
        <img
          src={brochureImageUrl(heroImage)}
          alt={section.title}
          className="h-48 w-full object-cover md:h-56 print:h-40"
        />
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {section.title}
            </h3>
            {meta?.category && (
              <span className="text-sm text-amber-600 font-medium">
                {"★".repeat(parseInt(meta.category) || 0)}{" "}
                {meta.category.includes("*") ? "" : meta.category}
              </span>
            )}
          </div>
        </div>

        {section.content && (
          <div className="space-y-2">
            {section.content.split("\n").map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-700">
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Dynamic data from hotel response */}
        {responseData && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Disponibilités & Tarifs
            </h4>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {(responseData.dateFrom || responseData.dateTo) && (
                <div>
                  <span className="text-slate-500">Dates : </span>
                  <span className="font-medium text-slate-900">
                    {responseData.dateFrom} — {responseData.dateTo}
                  </span>
                </div>
              )}
              {(responseData.roomsSimple || responseData.roomsDouble) && (
                <div>
                  <span className="text-slate-500">Chambres : </span>
                  <span className="font-medium text-slate-900">
                    {responseData.roomsSimple && `${responseData.roomsSimple} simples`}
                    {responseData.roomsSimple && responseData.roomsDouble && " / "}
                    {responseData.roomsDouble && `${responseData.roomsDouble} doubles`}
                  </span>
                </div>
              )}
              {(responseData.priceChf || responseData.priceEur) && (
                <div>
                  <span className="text-slate-500">Prix/nuit : </span>
                  <span className="font-medium text-slate-900">
                    {responseData.priceChf && `CHF ${responseData.priceChf}`}
                    {responseData.priceChf && responseData.priceEur && " / "}
                    {responseData.priceEur && `€ ${responseData.priceEur}`}
                  </span>
                </div>
              )}
              {(responseData.forfaitChf || responseData.forfaitEur) && (
                <div>
                  <span className="text-slate-500">Forfait séminaire : </span>
                  <span className="font-medium text-slate-900">
                    {responseData.forfaitChf && `CHF ${responseData.forfaitChf}`}
                    {responseData.forfaitChf && responseData.forfaitEur && " / "}
                    {responseData.forfaitEur && `€ ${responseData.forfaitEur}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conference package */}
        {meta?.conferencePackage && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Forfait conférence
            </h4>
            {meta.conferencePackage.includes.length > 0 && (
              <ul className="mb-2 space-y-1">
                {meta.conferencePackage.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 text-blue-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-4 text-sm">
              {meta.conferencePackage.priceDay && (
                <span className="font-medium text-slate-900">
                  Journée : {meta.conferencePackage.priceDay}
                </span>
              )}
              {meta.conferencePackage.priceHalfDay && (
                <span className="font-medium text-slate-900">
                  Demi-journée : {meta.conferencePackage.priceHalfDay}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Additional images */}
        {section.images.length > 1 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {section.images.slice(1).map((img, i) => (
              <img
                key={i}
                src={brochureImageUrl(img)}
                alt={`${section.title} ${i + 2}`}
                className="h-32 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
