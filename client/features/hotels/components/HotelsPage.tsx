"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hotel, HotelDocument } from "../types";
import {
  fetchHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} from "../api";
import {
  fetchAllHotelDocuments,
  uploadHotelDocument,
  deleteHotelDocument,
  downloadHotelDocument,
} from "@/features/documents/api";
import { downloadBlob } from "@/lib/download";
import { CreateHotelForm } from "./CreateHotelForm";
import { HotelRow } from "./HotelRow";

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelDocs, setHotelDocs] = useState<HotelDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [hotelsData, docsData] = await Promise.all([
        fetchHotels(),
        fetchAllHotelDocuments(),
      ]);
      setHotels(hotelsData);
      setHotelDocs(docsData);
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

  const handleCreate = async (nom: string, email: string) => {
    const created = await createHotel(nom, email || null);
    setHotels((prev) =>
      [...prev, created].sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      )
    );
  };

  const handleUpdate = async (
    id: string,
    fields: { nom: string; email: string | null }
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
      // Remove existing doc for same hotel+lang, add new one
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

      <CreateHotelForm onCreate={handleCreate} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nom
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
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Chargement…
                </td>
              </tr>
            ) : hotels.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Aucun hôtel enregistré pour l&apos;instant.
                </td>
              </tr>
            ) : (
              hotels.map((hotel) => (
                <HotelRow
                  key={hotel.id}
                  hotel={hotel}
                  docs={hotelDocs.filter((d) => d.hotelId === hotel.id)}
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
