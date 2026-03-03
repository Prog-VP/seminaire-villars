"use client";

import type { BrochureSection } from "../types";
import { brochureImageUrl } from "../utils";

type Props = {
  section: BrochureSection;
};

export function BrochureHero({ section }: Props) {
  const heroImage = section.images?.[0];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-slate-900 print:rounded-none print:break-after-page">
      {heroImage && (
        <img
          src={brochureImageUrl(heroImage)}
          alt={section.title}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      )}
      <div className="relative flex min-h-[400px] flex-col items-center justify-center px-8 py-20 text-center print:min-h-[500px]">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl print:text-5xl">
          {section.title}
        </h1>
        {section.content && (
          <p className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow">
            {section.content}
          </p>
        )}
      </div>
    </section>
  );
}
