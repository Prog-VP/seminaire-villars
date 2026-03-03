"use client";

import type { BrochureSection } from "../types";
import { BrochureHero } from "./BrochureHero";
import { BrochureTextSection } from "./BrochureTextSection";
import { BrochureHotelCard } from "./BrochureHotelCard";
import { BrochureConferenceTable } from "./BrochureConferenceTable";
import { BrochureActivities } from "./BrochureActivities";
import { BrochureSkiArea } from "./BrochureSkiArea";
import { BrochureContacts } from "./BrochureContacts";
import { BrochureFooter } from "./BrochureFooter";

type Props = {
  sections: BrochureSection[];
  showPrint?: boolean;
};

function renderSection(section: BrochureSection) {
  switch (section.type) {
    case "welcome":
      return <BrochureHero section={section} />;
    case "hotel":
      return (
        <div className="space-y-4">
          <BrochureHotelCard section={section} />
          {section.metadata?.conferenceRooms &&
            section.metadata.conferenceRooms.length > 0 && (
              <BrochureConferenceTable section={section} />
            )}
        </div>
      );
    case "venue":
      return <BrochureTextSection section={section} />;
    case "activities-summer":
    case "activities-winter":
      return <BrochureActivities section={section} />;
    case "ski":
      return <BrochureSkiArea section={section} />;
    case "contacts":
      return <BrochureContacts section={section} />;
    case "custom":
      return <BrochureTextSection section={section} />;
    default:
      return <BrochureTextSection section={section} />;
  }
}

export function BrochureView({ sections, showPrint = true }: Props) {
  const enabledSections = sections.filter((s) => s.enabled);

  if (enabledSections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Aucune section active dans cette brochure.
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-6">
      {enabledSections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
      <BrochureFooter
        onPrint={showPrint ? () => window.print() : undefined}
      />
    </div>
  );
}
