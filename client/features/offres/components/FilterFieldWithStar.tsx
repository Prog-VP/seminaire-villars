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

  return (
    <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(def.options ?? []).map((opt) => {
            const isActive = selectedSet.has(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onMultiToggle(def.key, opt)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium normal-case transition ${
                  isActive
                    ? "border-brand-900 bg-brand-900/10 text-brand-900"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {def.formatOption ? def.formatOption(opt) : opt}
              </button>
            );
          })}
        </div>
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
