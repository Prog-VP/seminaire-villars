import type { Dimension, EvoDimData, Filters, MonthFilters, MonthlyData, YearPin } from "../types";
import { DIM_CONFIG, DIM_LABELS } from "../types";
import type { ChartVisibilityKey } from "../chartVisibility";
import { ChartVisibilitySelector } from "./ChartVisibilitySelector";
import { ChartExportFrame } from "./ChartExportFrame";
import { EvolutionTable } from "./EvolutionTable";
import { GroupedBarChart } from "./GroupedBarChart";
import { MonthlyGroupedChart } from "./MonthlyGroupedChart";
import { Section } from "./Section";
import { YearTotalChart } from "./YearTotalChart";

type GeneralStatsTabProps = {
  hiddenCharts: Set<ChartVisibilityKey>;
  filters: Filters;
  yearPin: YearPin;
  monthFilters: MonthFilters;
  allYears: number[];
  envoiYearTotals: Record<number, number>;
  envoiMonthlyData: MonthlyData;
  sejourMonthlyData: MonthlyData;
  dimData: Record<Dimension, EvoDimData>;
  visibleTables: Set<string>;
  onToggleChartVisibility: (chartKey: ChartVisibilityKey) => void;
  getChartYearFilters: (chartKey: string) => Set<number>;
  onToggleChartYear: (chartKey: string, year: number) => void;
  onClearChartYearFilters: (chartKey: string) => void;
  onToggleMonth: (type: "envoi" | "sejour", month: number) => void;
  onClearMonth: (type: "envoi" | "sejour") => void;
  onToggleFilter: (dim: Dimension, value: string) => void;
  onClearFilter: (dim: Dimension) => void;
  onToggleCellFilter: (dim: Dimension, value: string, year: number) => void;
  onToggleTable: (key: string) => void;
};

const emptyYearSet = new Set<number>();

export function GeneralStatsTab({
  hiddenCharts,
  filters,
  yearPin,
  monthFilters,
  allYears,
  envoiYearTotals,
  envoiMonthlyData,
  sejourMonthlyData,
  dimData,
  visibleTables,
  onToggleChartVisibility,
  getChartYearFilters,
  onToggleChartYear,
  onClearChartYearFilters,
  onToggleMonth,
  onClearMonth,
  onToggleFilter,
  onClearFilter,
  onToggleCellFilter,
  onToggleTable,
}: GeneralStatsTabProps) {
  const envoiYearFilters = getChartYearFilters("mEnvoi");
  const sejourYearFilters = getChartYearFilters("mSejour");

  return (
    <>
      <ChartVisibilitySelector hiddenCharts={hiddenCharts} onToggle={onToggleChartVisibility} />

      <div className="grid gap-5">
        {!hiddenCharts.has("totalEnvoi") && (
          <Section
            title="Total des demandes par année — Dates d'envoi"
            filterActive={envoiYearFilters.size > 0}
            onClear={() => onClearChartYearFilters("mEnvoi")}
          >
            <ChartExportFrame fileName="statistiques-total-annuel-dates-envoi">
              <YearTotalChart
                totals={envoiYearTotals}
                activeYears={envoiYearFilters}
                allYears={allYears}
                onClickYear={(year) => onToggleChartYear("mEnvoi", year)}
              />
            </ChartExportFrame>
          </Section>
        )}
        {!hiddenCharts.has("mEnvoi") && (
          <Section
            title="Évolution mensuelle — Dates d'envoi"
            filterActive={monthFilters.envoi != null}
            onClear={() => onClearMonth("envoi")}
          >
            <ChartExportFrame fileName="statistiques-evolution-mensuelle-dates-envoi">
              <MonthlyGroupedChart
                data={envoiMonthlyData}
                activeMonth={monthFilters.envoi}
                activeYears={envoiYearFilters}
                allYears={allYears}
                onClickMonth={(month) => onToggleMonth("envoi", month)}
                onClickYear={(year) => onToggleChartYear("mEnvoi", year)}
              />
            </ChartExportFrame>
          </Section>
        )}
        {!hiddenCharts.has("mSejour") && (
          <Section
            title="Évolution mensuelle — Dates de séjour"
            filterActive={monthFilters.sejour != null}
            onClear={() => onClearMonth("sejour")}
          >
            <ChartExportFrame fileName="statistiques-evolution-mensuelle-dates-sejour">
              <MonthlyGroupedChart
                data={sejourMonthlyData}
                activeMonth={monthFilters.sejour}
                activeYears={sejourYearFilters}
                allYears={allYears}
                onClickMonth={(month) => onToggleMonth("sejour", month)}
                onClickYear={(year) => onToggleChartYear("mSejour", year)}
              />
            </ChartExportFrame>
          </Section>
        )}
      </div>

      <div className="space-y-5">
        {DIM_CONFIG.map(({ dim, limit }) => {
          if (hiddenCharts.has(dim)) return null;
          return (
            <DimensionStatsSection
              key={dim}
              dim={dim}
              limit={limit}
              filters={filters}
              yearPin={yearPin}
              allYears={allYears}
              data={dimData[dim]}
              isTableVisible={visibleTables.has(dim)}
              onToggleFilter={onToggleFilter}
              onClearFilter={onClearFilter}
              onToggleCellFilter={onToggleCellFilter}
              onToggleTable={onToggleTable}
            />
          );
        })}
      </div>
    </>
  );
}

function DimensionStatsSection({
  dim,
  limit,
  filters,
  yearPin,
  allYears,
  data,
  isTableVisible,
  onToggleFilter,
  onClearFilter,
  onToggleCellFilter,
  onToggleTable,
}: {
  dim: Dimension;
  limit?: number;
  filters: Filters;
  yearPin: YearPin;
  allYears: number[];
  data: EvoDimData;
  isTableVisible: boolean;
  onToggleFilter: (dim: Dimension, value: string) => void;
  onClearFilter: (dim: Dimension) => void;
  onToggleCellFilter: (dim: Dimension, value: string, year: number) => void;
  onToggleTable: (key: string) => void;
}) {
  return (
    <Section
      title={DIM_LABELS[dim]}
      filterActive={dim in filters}
      onClear={() => onClearFilter(dim)}
    >
      <div className="space-y-4">
        <ChartExportFrame fileName={`statistiques-${DIM_LABELS[dim]}`}>
          <GroupedBarChart
            data={data}
            limit={limit ? Math.min(limit, 10) : 10}
            labelMode={dim === "pays" ? "rate" : "count"}
            activeValue={filters[dim]}
            activeYears={emptyYearSet}
            allYears={allYears}
            onClickBar={(value) => onToggleFilter(dim, value)}
            hideLegend
          />
        </ChartExportFrame>
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => onToggleTable(dim)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-3.5 w-3.5 transition-transform ${isTableVisible ? "rotate-90" : ""}`}
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
            </svg>
            {isTableVisible ? "Masquer le tableau" : "Afficher le tableau"}
          </button>
          {isTableVisible && (
            <div className="mt-3">
              <EvolutionTable
                data={data}
                dim={dim}
                limit={limit}
                activeValue={filters[dim]}
                activeYear={yearPin?.dim === dim ? yearPin.year : undefined}
                activeYears={emptyYearSet}
                allYears={allYears}
                onClickRow={(value) => onToggleFilter(dim, value)}
                onClickCell={(value, year) => onToggleCellFilter(dim, value, year)}
              />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
