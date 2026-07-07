const boolOptions = [
  { value: "all", label: "Tous" },
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

export type FilterDef = {
  key: string;
  label: string;
  type: "text" | "select" | "multiselect" | "number" | "textarea" | "bool" | "date";
  options?: string[];
  formatOption?: (v: string) => string;
  placeholder?: string;
  span?: "wide" | "full";
};

export type FilterGroup = {
  title: string;
  filters: FilterDef[];
};

type FilterFieldWithStarProps = {
  def: FilterDef;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onMultiToggle: (key: string, option: string) => void;
  inputClass: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function FilterFieldWithStar({
  def,
  value,
  onChange,
  onMultiToggle,
  inputClass,
  isFavorite,
  onToggleFavorite,
}: FilterFieldWithStarProps) {
  const allValue = def.key === "hotelContacte" || def.key === "hotelRepondu" ? "" : "all";
  const allLabel = def.key === "stationDemandee" || def.key === "categorieHotel" ? "Toutes" : "Tous";

  const selectedSet = def.type === "multiselect" && value && value !== "all"
    ? new Set(value.split(","))
    : new Set<string>();
  const selectedOptions = (def.options ?? []).filter((opt) => selectedSet.has(opt));
  const selectedLabel = selectedOptions.length === 0
    ? allLabel
    : selectedOptions.length === 1
      ? (def.formatOption ? def.formatOption(selectedOptions[0]) : selectedOptions[0])
      : `${selectedOptions.length} sélectionnés`;

  return (
    <div className={`flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 ${def.span === "full" ? "md:col-span-2 lg:col-span-3" : def.span === "wide" ? "lg:col-span-2" : ""}`}>
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className={`transition ${isFavorite ? "text-amber-400 hover:text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {def.label}
        {def.type === "multiselect" && selectedSet.size > 0 && (
          <button
            type="button"
            onClick={() => onMultiToggle(def.key, "__clear__")}
            className="ml-auto text-[10px] font-medium normal-case text-slate-400 hover:text-slate-600"
          >
            effacer
          </button>
        )}
      </span>
      {def.type === "text" && (
        <input name={def.key} value={value} onChange={onChange} className={inputClass} />
      )}
      {def.type === "number" && (
        <input name={def.key} type="number" min={0} value={value} onChange={onChange} className={inputClass} />
      )}
      {def.type === "textarea" && (
        <textarea name={def.key} value={value} onChange={onChange} rows={2} className={inputClass} />
      )}
      {def.type === "select" && (
        <select name={def.key} value={value} onChange={onChange} className={inputClass}>
          <option value={allValue}>{allLabel}</option>
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {def.formatOption ? def.formatOption(opt) : opt}
            </option>
          ))}
        </select>
      )}
      {def.type === "multiselect" && (
        <details className="group relative mt-1">
          <summary className="flex min-h-[38px] cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-800 transition hover:border-slate-400 group-open:border-slate-500 group-open:ring-1 group-open:ring-slate-500 [&::-webkit-details-marker]:hidden">
            <span className="truncate">{selectedLabel}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </summary>
          <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => onMultiToggle(def.key, "__clear__")}
              className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm font-medium normal-case tracking-normal transition ${
                selectedSet.size === 0
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {allLabel}
            </button>
            {(def.options ?? []).map((opt) => {
              const isActive = selectedSet.has(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium normal-case tracking-normal text-slate-700 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onMultiToggle(def.key, opt)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                  />
                  <span className="truncate">{def.formatOption ? def.formatOption(opt) : opt}</span>
                </label>
              );
            })}
          </div>
        </details>
      )}
      {def.type === "date" && (
        <input name={def.key} type="date" value={value} onChange={onChange} className={inputClass} />
      )}
      {def.type === "bool" && (
        <select name={def.key} value={value} onChange={onChange} className={inputClass}>
          {boolOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function mergeFilterOption(
  options: string[],
  currentValue: string | "all" | null | undefined
) {
  if (!currentValue || currentValue === "all") {
    return options;
  }
  const values = currentValue.split(",");
  const missing = values.filter((v) => !options.includes(v));
  return missing.length > 0 ? [...options, ...missing] : options;
}
