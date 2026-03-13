"use client";

import { useShareDialog } from "@/features/offres/hooks/useShareDialog";
import { ShareHotelList } from "./ShareHotelList";
import { ShareSendList } from "./ShareSendList";
import type { Offer } from "../types";

type Props = {
  offer: Offer;
  onClose: () => void;
  onTokenCreated?: (token: string) => void;
};

export function ShareDialog({ offer, onClose, onTokenCreated }: Props) {
  const {
    hotels,
    shareUrl,
    isLoading,
    error,
    step,
    setStep,
    search,
    setSearch,
    selected,
    sentInSession,
    linkCopied,
    sendsByHotelId,
    filteredHotels,
    isAllNewSelected,
    toggleHotel,
    toggleSelectAll,
    handleCopyLink,
    handleSendOne,
    handleSendAll,
    selectedHotels,
  } = useShareDialog(offer, onClose, onTokenCreated);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Partager l&apos;offre
            </h2>
            <p className="text-sm text-slate-500">{offer.societeContact}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">
            Chargement...
          </div>
        ) : error ? (
          <div className="px-6 py-8">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        ) : step === "select" ? (
          <ShareHotelList
            hotels={hotels}
            filteredHotels={filteredHotels}
            search={search}
            setSearch={setSearch}
            selected={selected}
            sentInSession={sentInSession}
            sendsByHotelId={sendsByHotelId}
            isAllNewSelected={isAllNewSelected}
            toggleHotel={toggleHotel}
            toggleSelectAll={toggleSelectAll}
            shareUrl={shareUrl}
            linkCopied={linkCopied}
            handleCopyLink={handleCopyLink}
            onNext={() => setStep("send")}
            onClose={onClose}
          />
        ) : (
          <ShareSendList
            selectedHotels={selectedHotels}
            sentInSession={sentInSession}
            handleSendOne={handleSendOne}
            handleSendAll={handleSendAll}
            onBack={() => setStep("select")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
