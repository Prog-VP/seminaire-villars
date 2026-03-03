"use client";

import type { BrochureSection } from "../types";

type Props = {
  section: BrochureSection;
};

export function BrochureConferenceTable({ section }: Props) {
  const rooms = section.metadata?.conferenceRooms;
  if (!rooms || rooms.length === 0) return null;

  return (
    <section className="space-y-4 print:break-inside-avoid">
      <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
      {section.content && (
        <p className="text-sm text-slate-600">{section.content}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 font-semibold text-slate-700">Salle</th>
              <th className="px-3 py-2 font-semibold text-slate-700">m²</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Hauteur</th>
              <th className="px-3 py-2 font-semibold text-slate-700 text-center">Théâtre</th>
              <th className="px-3 py-2 font-semibold text-slate-700 text-center">Séminaire</th>
              <th className="px-3 py-2 font-semibold text-slate-700 text-center">U</th>
              <th className="px-3 py-2 font-semibold text-slate-700 text-center">Banquet</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 even:bg-slate-50/50"
              >
                <td className="px-3 py-2 font-medium text-slate-900">
                  {room.name}
                </td>
                <td className="px-3 py-2 text-slate-600">{room.m2}</td>
                <td className="px-3 py-2 text-slate-600">{room.height}</td>
                <td className="px-3 py-2 text-center text-slate-600">
                  {room.theatre || "—"}
                </td>
                <td className="px-3 py-2 text-center text-slate-600">
                  {room.seminar || "—"}
                </td>
                <td className="px-3 py-2 text-center text-slate-600">
                  {room.uShape || "—"}
                </td>
                <td className="px-3 py-2 text-center text-slate-600">
                  {room.banquet || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
