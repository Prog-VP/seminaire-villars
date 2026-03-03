"use client";

import type { BrochureSection } from "../types";
import { brochureImageUrl } from "../utils";

type Props = {
  section: BrochureSection;
};

export function BrochureActivities({ section }: Props) {
  const activities = section.metadata?.activities;

  return (
    <section className="space-y-4 print:break-inside-avoid">
      <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
      {section.content && (
        <p className="text-sm leading-relaxed text-slate-700">
          {section.content}
        </p>
      )}

      {activities && activities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {activity.image && (
                <img
                  src={brochureImageUrl(activity.image)}
                  alt={activity.name}
                  className="h-36 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="font-semibold text-slate-900">
                  {activity.name}
                </h4>
                {activity.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {activity.description}
                  </p>
                )}
                {activity.price && (
                  <p className="mt-2 text-sm font-medium text-brand-900">
                    {activity.price}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback images */}
      {(!activities || activities.length === 0) &&
        section.images &&
        section.images.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {section.images.map((img, i) => (
              <img
                key={i}
                src={brochureImageUrl(img)}
                alt={`${section.title} ${i + 1}`}
                className="w-full rounded-xl object-cover shadow-sm"
              />
            ))}
          </div>
        )}
    </section>
  );
}
