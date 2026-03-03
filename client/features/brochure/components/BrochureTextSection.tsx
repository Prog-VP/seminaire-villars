"use client";

import type { BrochureSection } from "../types";
import { brochureImageUrl } from "../utils";

type Props = {
  section: BrochureSection;
};

export function BrochureTextSection({ section }: Props) {
  const hasImages = section.images && section.images.length > 0;

  return (
    <section className="space-y-4 print:break-inside-avoid">
      <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
      <div className={hasImages ? "grid gap-6 md:grid-cols-2" : ""}>
        <div className="space-y-3">
          {section.content.split("\n").map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>
        {hasImages && (
          <div className="grid gap-3">
            {section.images.slice(0, 2).map((img, i) => (
              <img
                key={i}
                src={brochureImageUrl(img)}
                alt={`${section.title} ${i + 1}`}
                className="w-full rounded-xl object-cover shadow-sm"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
