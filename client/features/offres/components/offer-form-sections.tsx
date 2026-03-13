"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex gap-3">
        <span className="h-9 w-1 rounded-full bg-gradient-to-b from-brand-900 to-brand-500" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// Re-export all form sections so existing imports keep working
export { SocieteSection } from "./form-sections/SocieteSection";
export { ContactSection } from "./form-sections/ContactSection";
export { SejourSection } from "./form-sections/SejourSection";
export { SeminaireSection } from "./form-sections/SeminaireSection";
export { FinalisationSection } from "./form-sections/FinalisationSection";
