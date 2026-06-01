"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Hotel } from "../types";
import { countOffersUsingHotel } from "../api";
import { buildHotelPptTag, normalizeHotelPptTag } from "../utils";
import { IconButton } from "@/components/ui/IconButton";
import { INITIAL_FILTERS } from "@/features/offres/hooks/useOfferFiltering";

export function HotelRow({
  hotel,
  destinations,
  offerCount,
  onSave,
  onDelete,
}: {
  hotel: Hotel;
  destinations: string[];
  offerCount: number;
  onSave: (fields: {
    nom: string;
    email: string | null;
    email_cc: string | null;
    destination: string | null;
    ppt_tag: string | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState(hotel.nom);
  const [email, setEmail] = useState(hotel.email ?? "");
  const [emailCc, setEmailCc] = useState(hotel.email_cc ?? "");
  const [destination, setDestination] = useState(hotel.destination ?? "");
  const [pptTag, setPptTag] = useState(hotel.ppt_tag ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");

  useEffect(() => {
    setNom(hotel.nom);
    setEmail(hotel.email ?? "");
    setEmailCc(hotel.email_cc ?? "");
    setDestination(hotel.destination ?? "");
    setPptTag(hotel.ppt_tag ?? "");
  }, [hotel.nom, hotel.email, hotel.email_cc, hotel.destination, hotel.ppt_tag]);

  const handleSave = async () => {
    if (!nom.trim()) {
      setError("Le nom ne peut pas être vide.");
      return;
    }
    try {
      setStatus("saving");
      setError(null);
      await onSave({
        nom: nom.trim(),
        email: email.trim() || null,
        email_cc: emailCc.trim() || null,
        destination: destination.trim() || null,
        ppt_tag: normalizeHotelPptTag(pptTag) || null,
      });
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer."
      );
    } finally {
      setStatus("idle");
    }
  };

  const [usageCount, setUsageCount] = useState<number | null>(null);

  const handleDelete = async () => {
    try {
      setStatus("deleting");
      setError(null);
      setUsageCount(null);
      const count = await countOffersUsingHotel(hotel.id);
      if (count > 0) {
        setUsageCount(count);
        setStatus("idle");
        return;
      }
      const confirmation = window.confirm(
        `Supprimer l'hôtel « ${hotel.nom} » ?`
      );
      if (!confirmation) {
        setStatus("idle");
        return;
      }
      await onDelete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer."
      );
    } finally {
      setStatus("idle");
    }
  };

  const handleViewOffers = () => {
    const filters = { ...INITIAL_FILTERS, hotelContacte: hotel.nom };
    sessionStorage.setItem("offer-filters", JSON.stringify(filters));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNom(hotel.nom);
    setEmail(hotel.email ?? "");
    setEmailCc(hotel.email_cc ?? "");
    setDestination(hotel.destination ?? "");
    setPptTag(hotel.ppt_tag ?? "");
    setError(null);
  };

  const displayPptTag = hotel.ppt_tag || buildHotelPptTag(hotel.nom);

  return (
    <>
      <tr className="group">
        {isEditing ? (
          <>
            <td className="px-5 py-3">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={status === "saving"}
              />
            </td>
            <td className="px-5 py-3">
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={status === "saving"}
              >
                <option value="">—</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </td>
            <td className="px-5 py-3">
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={pptTag}
                placeholder={buildHotelPptTag(nom)}
                onChange={(e) => setPptTag(normalizeHotelPptTag(e.target.value))}
                disabled={status === "saving"}
              />
            </td>
            <td className="px-5 py-3">
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "saving"}
              />
            </td>
            <td className="px-5 py-3">
              <input
                type="text"
                placeholder="CC"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                disabled={status === "saving"}
              />
            </td>
            <td className="px-5 py-3">
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  label="Enregistrer"
                  icon="check"
                  onClick={handleSave}
                  disabled={status === "saving"}
                />
                <IconButton
                  label="Annuler"
                  icon="close"
                  onClick={handleCancel}
                  disabled={status === "saving"}
                />
              </div>
            </td>
          </>
        ) : (
          <>
            <td className="px-5 py-3.5 font-medium text-slate-900">
              <span className="flex items-center gap-2">
                {hotel.nom}
                {offerCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const filters = { ...INITIAL_FILTERS, hotelContacte: hotel.nom };
                      sessionStorage.setItem("offer-filters", JSON.stringify(filters));
                      window.open("/offres", "_blank");
                    }}
                    title={`Voir ${offerCount} offre${offerCount > 1 ? "s" : ""} liée${offerCount > 1 ? "s" : ""}`}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100"
                  >
                    {offerCount} offre{offerCount > 1 ? "s" : ""}
                  </button>
                )}
              </span>
            </td>
            <td className="px-5 py-3.5">
              {hotel.destination ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {hotel.destination}
                </span>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </td>
            <td className="px-5 py-3.5">
              <code className="inline-flex rounded bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600">
                {displayPptTag}
              </code>
            </td>
            <td className="px-5 py-3.5 text-slate-500">
              {hotel.email ?? "—"}
            </td>
            <td className="px-5 py-3.5 text-slate-500">
              {hotel.email_cc ?? "—"}
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  label="Modifier"
                  icon="edit"
                  onClick={() => setIsEditing(true)}
                />
                <IconButton
                  label="Supprimer"
                  icon="trash"
                  onClick={handleDelete}
                  disabled={status === "deleting"}
                  tone="danger"
                />
              </div>
            </td>
          </>
        )}
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="px-5 pb-2">
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          </td>
        </tr>
      )}
      {usageCount !== null && usageCount > 0 && (
        <tr>
          <td colSpan={6} className="px-5 pb-2">
            <p className="text-sm text-amber-700" role="alert">
              Suppression impossible : cet hôtel est lié à{" "}
              <Link
                href="/offres"
                onClick={handleViewOffers}
                className="font-medium underline hover:text-amber-900"
              >
                {usageCount} offre{usageCount > 1 ? "s" : ""}
              </Link>.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
