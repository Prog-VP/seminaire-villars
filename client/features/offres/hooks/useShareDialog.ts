"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createShareLink, fetchOfferHotelSends, recordHotelSend, deleteHotelSend } from "@/features/offres/api";
import { fetchHotels } from "@/features/hotels/api";
import { createClient } from "@/lib/supabase/client";
import {
  buildMailto,
  DEFAULT_SHARE_EMAIL_TEMPLATE,
  normalizeShareEmailTemplate,
  SHARE_EMAIL_TEMPLATE_KEYS,
  type ShareEmailTemplate,
} from "@/features/offres/components/share-utils";
import type { Offer, OfferHotelSend } from "../types";
import type { Hotel } from "@/features/hotels/types";

export type Step = "select" | "send";

export function useShareDialog(offer: Offer, onClose: () => void, onTokenCreated?: (token: string) => void) {
  // Data
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [sends, setSends] = useState<OfferHotelSend[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<ShareEmailTemplate>(
    DEFAULT_SHARE_EMAIL_TEMPLATE
  );
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
  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [hotelList, sendList, templateConfig] = await Promise.all([
      fetchHotels(),
      fetchOfferHotelSends(offer.id),
      supabase
        .from("app_config")
        .select("key, value")
        .in("key", [
          SHARE_EMAIL_TEMPLATE_KEYS.subject,
          SHARE_EMAIL_TEMPLATE_KEYS.body,
        ]),
    ]);

    let template: ShareEmailTemplate | null = null;
    if (templateConfig.data) {
      const values = new Map(
        templateConfig.data.map((row) => [row.key as string, row.value as string])
      );
      template = normalizeShareEmailTemplate({
        subject:
          values.get(SHARE_EMAIL_TEMPLATE_KEYS.subject) ??
          DEFAULT_SHARE_EMAIL_TEMPLATE.subject,
        body:
          values.get(SHARE_EMAIL_TEMPLATE_KEYS.body) ??
          DEFAULT_SHARE_EMAIL_TEMPLATE.body,
      });
    }

    // Generate or reuse share link
    let url: string;
    if (offer.shareToken) {
      url = `${window.location.origin}/partage/offres/${offer.shareToken}`;
    } else {
      const created = await createShareLink(offer.id);
      url = created.shareUrl;
      onTokenCreated?.(created.token);
    }

    return { hotelList, sendList, template, url };
  }, [offer.id, offer.shareToken, onTokenCreated]);

  useEffect(() => {
    fetchData()
      .then(({ hotelList, sendList, template, url }) => {
        setHotels(hotelList);
        setSends(sendList);
        if (template) setEmailTemplate(template);
        setShareUrl(url);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur de chargement.");
      })
      .finally(() => setIsLoading(false));
  }, [fetchData]);

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
    window.open(buildMailto(offer, hotel, shareUrl, emailTemplate), "_self");

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
    const hotelsToSend = hotels.filter((h) => selected.has(h.id) && h.email);
    if (hotelsToSend.length === 0) return;

    // Use temporary <a> elements to trigger mailto links without popup blocking
    for (const hotel of hotelsToSend) {
      const a = document.createElement("a");
      a.href = buildMailto(offer, hotel, shareUrl, emailTemplate);
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Record all sends in DB
    for (const hotel of hotelsToSend) {
      try {
        await recordHotelSend(offer.id, hotel.id);
        setSentInSession((prev) => new Set(prev).add(hotel.id));
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
    }
  };

  // Delete a send record
  const handleDeleteSend = async (hotelId: string) => {
    try {
      await deleteHotelSend(offer.id, hotelId);
      setSends((prev) => prev.filter((s) => s.hotelId !== hotelId));
      setSentInSession((prev) => {
        const next = new Set(prev);
        next.delete(hotelId);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete send:", err);
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
    handleDeleteSend,
    selectedHotels,
  };
}
