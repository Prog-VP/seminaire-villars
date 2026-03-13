"use client";

import type { ConferenceRoom, Activity, SkiPrice } from "../types";

export function ConferenceRoomsEditor({
  rooms,
  onChange,
}: {
  rooms: ConferenceRoom[];
  onChange: (rooms: ConferenceRoom[]) => void;
}) {
  const update = (idx: number, field: keyof ConferenceRoom, value: string | number) => {
    const next = [...rooms];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Salles de conférence
      </label>
      <div className="overflow-x-auto text-xs">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-1 py-1">Salle</th>
              <th className="px-1 py-1">m²</th>
              <th className="px-1 py-1">Haut.</th>
              <th className="px-1 py-1">Th.</th>
              <th className="px-1 py-1">Sém.</th>
              <th className="px-1 py-1">U</th>
              <th className="px-1 py-1">Banq.</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-1 py-1">
                  <input
                    value={room.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    className="w-20 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={room.m2}
                    onChange={(e) => update(i, "m2", e.target.value)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={room.height}
                    onChange={(e) => update(i, "height", e.target.value)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.theatre}
                    onChange={(e) => update(i, "theatre", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.seminar}
                    onChange={(e) => update(i, "seminar", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.uShape}
                    onChange={(e) => update(i, "uShape", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={room.banquet}
                    onChange={(e) => update(i, "banquet", parseInt(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActivitiesEditor({
  activities,
  onChange,
}: {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
}) {
  const update = (idx: number, field: keyof Activity, value: string) => {
    const next = [...activities];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Activités
      </label>
      <div className="space-y-2">
        {activities.map((a, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              value={a.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Nom"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={a.description}
              onChange={(e) => update(i, "description", e.target.value)}
              placeholder="Description"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={a.price}
              onChange={(e) => update(i, "price", e.target.value)}
              placeholder="Prix"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkiPricesEditor({
  prices,
  onChange,
}: {
  prices: SkiPrice[];
  onChange: (prices: SkiPrice[]) => void;
}) {
  const update = (idx: number, field: keyof SkiPrice, value: string) => {
    const next = [...prices];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Tarifs ski
      </label>
      <div className="space-y-2">
        {prices.map((p, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              value={p.period}
              onChange={(e) => update(i, "period", e.target.value)}
              placeholder="Période"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={p.skipass}
              onChange={(e) => update(i, "skipass", e.target.value)}
              placeholder="Forfait"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <input
              value={p.rental}
              onChange={(e) => update(i, "rental", e.target.value)}
              placeholder="Location"
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
