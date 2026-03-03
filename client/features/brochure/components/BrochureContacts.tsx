"use client";

import type { BrochureSection } from "../types";

type Props = {
  section: BrochureSection;
};

export function BrochureContacts({ section }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-6 print:break-inside-avoid">
      <h2 className="mb-4 text-2xl font-bold text-slate-900">
        {section.title}
      </h2>
      <div className="space-y-2">
        {section.content.split("\n").map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-700">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
