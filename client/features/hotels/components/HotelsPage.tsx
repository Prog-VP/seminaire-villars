"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hotel, HotelDocument } from "../types";
import {
  fetchHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  countOffersPerHotel,
} from "../api";
import {
  fetchAllHotelDocuments,
  uploadHotelDocument,
  deleteHotelDocument,
  downloadHotelDocument,
} from "@/features/documents/api";
import { downloadBlob } from "@/lib/download";
import { useSettings } from "@/features/settings/context";
import { CreateHotelForm } from "./CreateHotelForm";
import { HotelRow } from "./HotelRow";

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelDocs, setHotelDocs] = useState<HotelDocument[]>([]);
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string | null>(null);
  const { options: settingsOptions } = useSettings();

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [hotelsData, docsData, counts] = await Promise.all([
        fetchHotels(),
        fetchAllHotelDocuments(),
        countOffersPerHotel(),
      ]);
      setHotels(hotelsData);
      setHotelDocs(docsData);
      setOfferCounts(counts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les hôtels."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredHotels = useMemo(() => {
    let result = hotels;
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      result = result.filter((h) => h.nom.toLowerCase().includes(q));
    }
    if (destinationFilter) {
      result = result.filter((h) => h.destination === destinationFilter);
    }
    return result;
  }, [hotels, nameFilter, destinationFilter]);

  const destinations = settingsOptions.stationDemandee;

  const handleCreate = async (nom: string, email: string, destination: string) => {
    const created = await createHotel(nom, email || null, destination || null);
    setHotels((prev) =>
      [...prev, created].sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      )
    );
  };

  const handleUpdate = async (
    id: string,
    fields: { nom: string; email: string | null; destination: string | null }
  ) => {
    const updated = await updateHotel(id, fields);
    setHotels((prev) => {
      const next = prev.map((h) => (h.id === id ? updated : h));
      next.sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      );
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await deleteHotel(id);
    setHotels((prev) => prev.filter((h) => h.id !== id));
    setHotelDocs((prev) => prev.filter((d) => d.hotelId !== id));
  };

  const handleUploadDoc = async (hotelId: string, lang: string, file: File) => {
    const doc = await uploadHotelDocument(hotelId, lang, file);
    setHotelDocs((prev) => {
      const filtered = prev.filter(
        (d) => !(d.hotelId === hotelId && d.lang === lang)
      );
      return [...filtered, doc];
    });
  };

  const handleDeleteDoc = async (doc: HotelDocument) => {
    await deleteHotelDocument(doc.id, doc.filePath);
    setHotelDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const handleDownloadDoc = async (doc: HotelDocument) => {
    const blob = await downloadHotelDocument(doc.filePath);
    downloadBlob(blob, doc.filePath.split("/").pop() ?? "document.docx");
  };

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      <CreateHotelForm onCreate={handleCreate} destinations={destinations} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nom
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrer…"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="block w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </th>
              <th className="px-5 py-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Destination
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDestinationFilter(null)}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                        destinationFilter === null
                          ? "bg-slate-700 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      Tous
                    </button>
                    {destinations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setDestinationFilter(destinationFilter === d ? null : d)
                        }
                        className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                          destinationFilter === d
                            ? "bg-slate-700 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Documents
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Chargement…
                </td>
              </tr>
            ) : filteredHotels.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  {hotels.length === 0
                    ? "Aucun hôtel enregistré pour l\u2019instant."
                    : "Aucun hôtel ne correspond au filtre."}
                </td>
              </tr>
            ) : (
              filteredHotels.map((hotel) => (
                <HotelRow
                  key={hotel.id}
                  hotel={hotel}
                  docs={hotelDocs.filter((d) => d.hotelId === hotel.id)}
                  destinations={destinations}
                  offerCount={offerCounts[hotel.id] ?? 0}
                  onSave={(fields) => handleUpdate(hotel.id, fields)}
                  onDelete={() => handleDelete(hotel.id)}
                  onUploadDoc={(lang, file) =>
                    handleUploadDoc(hotel.id, lang, file)
                  }
                  onDeleteDoc={handleDeleteDoc}
                  onDownloadDoc={handleDownloadDoc}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
