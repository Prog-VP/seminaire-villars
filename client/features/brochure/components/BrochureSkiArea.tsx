"use client";

import type { BrochureSection } from "../types";
import { brochureImageUrl } from "../utils";

type Props = {
  section: BrochureSection;
};

export function BrochureSkiArea({ section }: Props) {
  const prices = section.metadata?.skiPrices;
  const heroImage = section.images?.[0];

  return (
    <section className="space-y-4 print:break-inside-avoid">
      <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>

      <div className={heroImage ? "grid gap-6 md:grid-cols-2" : ""}>
        <div className="space-y-3">
          {section.content.split("\n").map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-700">
              {p}
            </p>
          ))}
        </div>
        {heroImage && (
          <img
            src={brochureImageUrl(heroImage)}
            alt={section.title}
            className="w-full rounded-xl object-cover shadow-sm"
          />
        )}
      </div>

      {prices && prices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 font-semibold text-slate-700">
                  Période
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  Forfait ski
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  Location matériel
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 even:bg-slate-50/50"
                >
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {row.period}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.skipass}</td>
                  <td className="px-3 py-2 text-slate-600">{row.rental}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
