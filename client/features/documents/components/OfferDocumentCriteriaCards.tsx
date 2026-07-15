type OfferDocumentCriteriaCardsProps = {
  criteria: {
    lang: string;
    offerDestination: string;
    generationDestination: string;
    seasons: string[];
    hotelsCount: number;
  };
  includedResponseCount: number;
};

export function OfferDocumentCriteriaCards({
  criteria,
  includedResponseCount,
}: OfferDocumentCriteriaCardsProps) {
  return (
    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
      <CriteriaCard label="Langue" value={criteria.lang} />
      <CriteriaCard label="Destination offre" value={criteria.offerDestination} />
      <CriteriaCard label="Destination PPT" value={criteria.generationDestination} />
      <CriteriaCard
        label="Saison"
        value={criteria.seasons.length ? criteria.seasons.join(", ") : "ALL"}
      />
      <CriteriaCard
        label="Hôtels inclus"
        value={`${includedResponseCount} / ${criteria.hotelsCount}`}
      />
    </div>
  );
}

function CriteriaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-700">{value}</p>
    </div>
  );
}
