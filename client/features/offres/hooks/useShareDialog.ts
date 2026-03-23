"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createShareLink, fetchOfferHotelSends, recordHotelSend } from "@/features/offres/api";
import { fetchHotels } from "@/features/hotels/api";
import { buildMailto } from "@/features/offres/components/share-utils";
import type { Offer, OfferHotelSend } from "../types";
import type { Hotel } from "@/features/hotels/types";

export type Step = "select" | "send";

export function useShareDialog(offer: Offer, onClose: () => void, onTokenCreated?: (token: string) => void) {
  // Data
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [sends, setSends] = useState<OfferHotelSend[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<Step>("select");
  const [search, setSearch] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string | null>(() => {
    const station = offer.stationDemandee?.toLowerCase();
    if (!station) return null;
    if (station.includes("diableret")) return "Diablerets";
    if (station.includes("villars")) return "Villars";
    return null;
  });
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

  const destinations = useMemo(() => {
    const set = new Set<string>();
    for (const h of hotels) if (h.destination) set.add(h.destination);
    return Array.from(set).sort();
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    let list = hotels;
    if (destinationFilter) {
      list = list.filter((h) => h.destination === destinationFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((h) => h.nom.toLowerCase().includes(q));
    }
    return list;
  }, [hotels, search, destinationFilter]);

  const unsendedWithEmail = useMemo(
    () => filteredHotels.filter((h) => !!h.email && !sendsByHotelId.has(h.id)),
    [filteredHotels, sendsByHotelId]
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

  // Send handlers
  const handleSendOne = async (hotel: Hotel) => {
    // Open mailto
    window.open(buildMailto(offer, hotel, shareUrl), "_self");

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

  return {
    hotels,
    shareUrl,
    isLoading,
    error,
    step,
    setStep,
    search,
    setSearch,
    destinationFilter,
    setDestinationFilter,
    destinations,
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
  };
}
