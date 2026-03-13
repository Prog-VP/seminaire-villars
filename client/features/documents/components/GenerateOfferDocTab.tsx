"use client";

import type { Offer, HotelResponse, OfferHotelSend } from "@/features/offres/types";
import { useDocumentGeneration } from "./useDocumentGeneration";
import { DocFilters } from "./DocFilters";
import { DocBlocksPanel } from "./DocBlocksPanel";
import { DocOrderPanel } from "./DocOrderPanel";

type GenerateOfferDocTabProps = {
  offer: Offer;
  hotelResponses?: HotelResponse[];
  sends?: OfferHotelSend[];
};

export function GenerateOfferDocTab({
  offer,
  hotelResponses = [],
  sends = [],
}: GenerateOfferDocTabProps) {
  const gen = useDocumentGeneration({ offer, hotelResponses, sends });

  if (gen.isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {gen.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{gen.error}</p>
        </div>
      )}

      {/* Filters */}
      <DocFilters
        destinations={gen.destinations}
        seasons={gen.seasons}
        langs={gen.langs}
        filterDest={gen.filterDest}
        setFilterDest={gen.setFilterDest}
        filterSeason={gen.filterSeason}
        setFilterSeason={gen.setFilterSeason}
        filterLang={gen.filterLang}
        setFilterLang={gen.setFilterLang}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT PANEL: blocks + hotel responses for selection */}
        <DocBlocksPanel
          blocks={gen.blocks}
          filteredBlocks={gen.filteredBlocks}
          grouped={gen.grouped}
          selectedBlockIds={gen.selectedBlockIds}
          selectedBlockSet={gen.selectedBlockSet}
          toggleBlock={gen.toggleBlock}
          hotelResponses={hotelResponses}
          responsesWithHotelId={gen.responsesWithHotelId}
          selectedResponseIds={gen.selectedResponseIds}
          selectedResponseSet={gen.selectedResponseSet}
          toggleResponse={gen.toggleResponse}
          localOfferTexts={gen.localOfferTexts}
          handleOfferTextChange={gen.handleOfferTextChange}
        />

        {/* RIGHT PANEL: ordered selection + DnD */}
        <DocOrderPanel
          orderedItems={gen.orderedItems}
          blockById={gen.blockById}
          responseById={gen.responseById}
          responseDocPicks={gen.responseDocPicks}
          hotelsWithDocs={gen.hotelsWithDocs}
          hotelDocsByHotelAndLang={gen.hotelDocsByHotelAndLang}
          langsForHotel={gen.langsForHotel}
          sensors={gen.sensors}
          handleDragEnd={gen.handleDragEnd}
          removeItem={gen.removeItem}
          handleDocPickChange={gen.handleDocPickChange}
          handleGenerate={gen.handleGenerate}
          isGenerating={gen.isGenerating}
        />
      </div>
    </div>
  );
}
