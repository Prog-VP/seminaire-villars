"use client";

import { useRouter } from "next/navigation";
import type { DashboardEntity } from "@/types/entities";

type EntityTableProps<T extends DashboardEntity> = {
  title: string;
  description: string;
  baseHref: string;
  rows: T[];
};

export function EntityTable<T extends DashboardEntity>({
  title,
  description,
  baseHref,
  rows,
}: EntityTableProps<T>) {
  const router = useRouter();

  const handleNavigate = (id: string) => {
    router.push(`${baseHref}/${id}`);
  };

  return (
    <section>
      <header className="mb-6 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tableau
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Nom</th>
              <th className="px-6 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleNavigate(row.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleNavigate(row.id);
                  }
                }}
                tabIndex={0}
                role="button"
                className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{row.nom}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {row.description}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  Aucun élément disponible pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
