"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createShareLink, fetchOfferHotelSends, recordHotelSend } from "@/features/offres/api";
import { fetchHotels } from "@/features/hotels/api";
import { getEffectiveDates, computeNights } from "@/features/offres/utils";
import type { Offer, OfferHotelSend } from "../types";
import type { Hotel } from "@/features/hotels/types";

type Props = {
  offer: Offer;
  onClose: () => void;
  onTokenCreated?: (token: string) => void;
};

type Step = "select" | "send";

export function ShareDialog({ offer, onClose, onTokenCreated }: Props) {
  // Data
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [sends, setSends] = useState<OfferHotelSend[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<Step>("select");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sentInSession, setSentInSession] = useState<Set<string>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [hotelList, sendList] = await Promise.all([
        fetchHotels(),
        fetchOfferHotelSends(offer.id),
      ]);

      setHotels(hotelList);
      setSends(sendList);

      // Generate or reuse share link
      if (offer.shareToken) {
        setShareUrl(`${window.location.origin}/partage/offres/${offer.shareToken}`);
      } else {
        const { shareUrl: url, token } = await createShareLink(offer.id);
        setShareUrl(url);
        onTokenCreated?.(token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setIsLoading(false);
    }
  }, [offer.id, offer.shareToken, onTokenCreated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Derived data
  const sendsByHotelId = useMemo(() => {
    const map = new Map<string, OfferHotelSend>();
    for (const s of sends) map.set(s.hotelId, s);
    return map;
  }, [sends]);

  const filteredHotels = useMemo(() => {
    if (!search.trim()) return hotels;
    const q = search.toLowerCase();
    return hotels.filter((h) => h.nom.toLowerCase().includes(q));
  }, [hotels, search]);

  const hotelsWithEmail = useMemo(
    () => hotels.filter((h) => !!h.email),
    [hotels]
  );

  const unsendedWithEmail = useMemo(
    () => hotelsWithEmail.filter((h) => !sendsByHotelId.has(h.id)),
    [hotelsWithEmail, sendsByHotelId]
  );

  // Selection helpers
  const toggleHotel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllNew = () => {
    setSelected(new Set(unsendedWithEmail.map((h) => h.id)));
  };

  const isAllNewSelected =
    unsendedWithEmail.length > 0 &&
    unsendedWithEmail.every((h) => selected.has(h.id));

  const toggleSelectAll = () => {
    if (isAllNewSelected) {
      setSelected(new Set());
    } else {
      selectAllNew();
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback: select all in a temp input
    }
  };

  // Build mailto
  const buildMailto = (hotel: Hotel): string => {
    const eff = getEffectiveDates(offer);
    const nights = computeNights(eff.du, eff.au);
    const fmtDate = (d: string | null) =>
      d ? new Date(d).toLocaleDateString("fr-CH") : "?";

    const subject = `Demande de disponibilité – ${offer.societeContact} – ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

    const dateOptionsText =
      offer.dateOptions && offer.dateOptions.length > 0
        ? offer.dateOptions
            .map(
              (opt, i) =>
                `  Option ${i + 1} : du ${fmtDate(opt.du)} au ${fmtDate(opt.au)}`
            )
            .join("\n")
        : `  Du ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

    const lines = [
      `Bonjour,`,
      ``,
      `Pourriez-vous nous faire parvenir une offre pour le séjour suivant :`,
      ``,
      `Client : ${offer.societeContact}`,
      `Type : ${offer.typeSejour || "Non défini"}`,
      ...(offer.dateOptions && offer.dateOptions.length > 1
        ? [`Dates (${offer.dateOptions.length} options) :`, dateOptionsText]
        : [`Dates : du ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`]),
      ...(nights ? [`Nombre de nuits : ${nights}`] : []),
      ...(offer.nombrePax ? [`Participants : ${offer.nombrePax}`] : []),
      ...(offer.chambresSimple || offer.chambresDouble
        ? [
            `Chambres : ${[
              offer.chambresSimple ? `${offer.chambresSimple} simple(s)` : "",
              offer.chambresDouble ? `${offer.chambresDouble} double(s)` : "",
              offer.chambresAutre ? `${offer.chambresAutre} autre(s)` : "",
            ]
              .filter(Boolean)
              .join(", ")}`,
          ]
        : []),
      ...(offer.seminaire
        ? [`Séminaire : Oui${offer.seminaireDetails ? ` – ${offer.seminaireDetails}` : ""}`]
        : []),
      ``,
      `Merci de remplir votre offre via ce lien :`,
      shareUrl ?? "",
      ``,
      `Cordialement,`,
    ];

    const body = lines.join("\n");
    return `mailto:${encodeURIComponent(hotel.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Send handlers
  const handleSendOne = async (hotel: Hotel) => {
    // Open mailto
    window.open(buildMailto(hotel), "_self");

    // Record in DB
    try {
      await recordHotelSend(offer.id, hotel.id);
      setSentInSession((prev) => new Set(prev).add(hotel.id));
      // Update sends list
      setSends((prev) => {
        const existing = prev.find((s) => s.hotelId === hotel.id);
        if (existing) {
          return prev.map((s) =>
            s.hotelId === hotel.id ? { ...s, sentAt: new Date().toISOString() } : s
          );
        }
        return [
          {
            id: crypto.randomUUID(),
            hotelId: hotel.id,
            hotelName: hotel.nom,
            hotelEmail: hotel.email,
            sentAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    } catch (err) {
      console.error("Failed to record send:", err);
    }
  };

  const handleSendAll = async () => {
    const selectedHotels = hotels.filter((h) => selected.has(h.id) && h.email);
    for (let i = 0; i < selectedHotels.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 400));
      await handleSendOne(selectedHotels[i]);
    }
  };

  // Selected hotels for step 2
  const selectedHotels = hotels.filter((h) => selected.has(h.id));

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
          <>
            {/* Share link */}
            <div className="border-b border-slate-100 px-6 py-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Lien de partage
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl ?? ""}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {linkCopied ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>

            {/* Hotel list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {hotels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-600">
                    Aucun hôtel enregistré.
                  </p>
                  <a
                    href="/reglages/hotels"
                    className="mt-2 inline-block text-sm font-medium text-brand-900 hover:underline"
                  >
                    Ajouter des hôtels →
                  </a>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Rechercher un hôtel..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <label className="flex items-center gap-1.5 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={isAllNewSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                      />
                      Tout
                    </label>
                  </div>

                  {/* List */}
                  <div className="space-y-1">
                    {filteredHotels.map((hotel) => {
                      const send = sendsByHotelId.get(hotel.id);
                      const hasEmail = !!hotel.email;
                      const wasSentInSession = sentInSession.has(hotel.id);
                      const isChecked = selected.has(hotel.id);

                      return (
                        <label
                          key={hotel.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                            !hasEmail
                              ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                              : isChecked
                                ? "border-brand-200 bg-brand-50"
                                : "cursor-pointer border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!hasEmail}
                            checked={isChecked}
                            onChange={() => toggleHotel(hotel.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900 disabled:opacity-40"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {hotel.nom}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {hotel.email || "Pas d'email"}
                            </p>
                          </div>
                          {(send || wasSentInSession) && (
                            <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Envoyé le{" "}
                              {new Date(
                                wasSentInSession && !send
                                  ? new Date().toISOString()
                                  : send!.sentAt
                              ).toLocaleDateString("fr-CH")}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {hotels.length > 0 && (
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => setStep("send")}
                  disabled={selected.size === 0}
                  className="rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Préparer les emails ({selected.size})
                </button>
              </div>
            )}
          </>
        ) : (
          /* Step 2: Send emails */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  {selectedHotels.length} hôtel{selectedHotels.length > 1 ? "s" : ""} sélectionné{selectedHotels.length > 1 ? "s" : ""}
                </p>
                {selectedHotels.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSendAll}
                    className="rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-800"
                  >
                    Ouvrir tous les emails
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {selectedHotels.map((hotel) => {
                  const wasSent = sentInSession.has(hotel.id);
                  return (
                    <div
                      key={hotel.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {hotel.nom}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {hotel.email}
                        </p>
                      </div>
                      {wasSent ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Envoyé
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOne(hotel)}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-900 transition hover:bg-brand-100"
                        >
                          Envoyer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
