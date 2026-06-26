import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeEurChfRate } from "@/features/offres/components/share-offer-utils";

export function ChfEurRate() {
  const [rate, setRate] = useState("");
  const [savedRate, setSavedRate] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("app_config").select("value").eq("key", "chf_eur_rate").single()
      .then(({ data }) => {
        if (!data) return;
        const normalized = normalizeEurChfRate(parseFloat(data.value)).toString();
        setRate(normalized);
        setSavedRate(normalized);
      });
  }, []);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setRate(savedRate);
    setEditing(false);
    setStatus("idle");
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      const supabase = createClient();
      const normalizedRate = normalizeEurChfRate(parseFloat(rate.trim())).toString();
      const { error } = await supabase
        .from("app_config")
        .upsert({ key: "chf_eur_rate", value: normalizedRate }, { onConflict: "key" });
      if (error) throw error;
      setRate(normalizedRate);
      setSavedRate(normalizedRate);
      setEditing(false);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">Taux de change EUR/CHF</p>
        <p className="text-xs text-slate-500">1 EUR = X CHF. Utilisé sur la page de partage pour convertir les prix CHF en EUR.</p>
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={rate}
        onChange={(event) => {
          setRate(event.target.value);
          setStatus("idle");
        }}
        readOnly={!editing}
        className={`w-24 rounded-lg border px-3 py-2 text-right text-sm tabular-nums transition ${
          editing
            ? "border-slate-300 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            : "border-transparent bg-slate-50 text-slate-600"
        }`}
        placeholder="0.93"
      />
      {!editing ? (
        <button
          type="button"
          onClick={handleEdit}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {status === "saved" ? "Enregistré" : "Modifier"}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-lg bg-brand-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {status === "saving" ? "…" : "Enregistrer"}
          </button>
        </div>
      )}
      {status === "error" && <span className="text-xs text-rose-600">Erreur</span>}
    </div>
  );
}
