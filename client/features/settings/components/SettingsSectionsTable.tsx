import type { SettingType } from "../types";

type SettingsSection = {
  type: SettingType;
  title: string;
  description: string;
};

type SettingsSectionsTableProps = {
  sections: SettingsSection[];
  totals: Record<SettingType, number>;
  isLoading: boolean;
  hasLoaded: boolean;
  onSelect: (type: SettingType) => void;
};

export function SettingsSectionsTable({
  sections,
  totals,
  isLoading,
  hasLoaded,
  onSelect,
}: SettingsSectionsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Champ
            </th>
            <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
              Description
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Options
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sections.map((section) => (
            <tr
              key={section.type}
              onClick={() => onSelect(section.type)}
              className="cursor-pointer transition hover:bg-slate-50"
            >
              <td className="px-5 py-3.5 font-medium text-slate-900">
                {section.title}
              </td>
              <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">
                {section.description}
              </td>
              <td className="px-5 py-3.5 text-right">
                <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {isLoading && !hasLoaded ? "…" : totals[section.type]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
