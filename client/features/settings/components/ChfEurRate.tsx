import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeEurChfRate } from "@/features/offres/components/share-offer-utils";
import {
  EXCHANGE_RATE_CONFIG_KEYS,
  formatEurChfRateForStorage,
} from "@/lib/exchange-rate";

type RateStatus = "idle" | "saving" | "syncing" | "saved" | "error";

type EcbRateResponse = {
  rate: string;
  source: "ECB";
  sourceDate: string;
  updatedAt: string;
};

function parseRateInput(value: string) {
  return Number.parseFloat(value.trim().replace(",", "."));
}

function normalizeRateValue(value: string) {
  const parsed = parseRateInput(value);
  const normalized = normalizeEurChfRate(parsed);
  return normalized > 0 ? formatEurChfRateForStorage(normalized) : "";
}

function formatSourceDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("fr-CH").format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

function formatUpdatedAt(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-CH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function ChfEurRate() {
  const [rate, setRate] = useState("");
  const [savedRate, setSavedRate] = useState("");
  const [source, setSource] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<RateStatus>("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("app_config")
      .select("key, value")
      .in("key", Object.values(EXCHANGE_RATE_CONFIG_KEYS))
      .then(({ data }) => {
        if (!data) return;
        const values = new Map(
          data.map((row) => [row.key as string, row.value as string]),
        );
        const storedRate = values.get(EXCHANGE_RATE_CONFIG_KEYS.eurChfRate);
        if (storedRate) {
          const normalized = normalizeRateValue(storedRate);
          if (normalized) {
            setRate(normalized);
            setSavedRate(normalized);
          }
        }
        setSource(values.get(EXCHANGE_RATE_CONFIG_KEYS.eurChfRateSource) ?? "");
        setSourceDate(values.get(EXCHANGE_RATE_CONFIG_KEYS.eurChfRateSourceDate) ?? "");
        setUpdatedAt(values.get(EXCHANGE_RATE_CONFIG_KEYS.eurChfRateUpdatedAt) ?? "");
      });
  }, []);

  const handleEdit = () => {
    setEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    setRate(savedRate);
    setEditing(false);
    setStatus("idle");
    setMessage("");
  };

  const handleSave = async () => {
    setStatus("saving");
    setMessage("");
    try {
      const supabase = createClient();
      const normalizedRate = normalizeRateValue(rate);
      if (!normalizedRate) throw new Error("Taux invalide.");
      const nextUpdatedAt = new Date().toISOString();
      const { error } = await supabase.from("app_config").upsert(
        [
          { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRate, value: normalizedRate },
          { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRateSource, value: "manual" },
          { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRateSourceDate, value: "" },
          { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRateUpdatedAt, value: nextUpdatedAt },
        ],
        { onConflict: "key" },
      );
      if (error) throw error;
      setRate(normalizedRate);
      setSavedRate(normalizedRate);
      setSource("manual");
      setSourceDate("");
      setUpdatedAt(nextUpdatedAt);
      setEditing(false);
      setStatus("saved");
      setMessage("Taux manuel enregistré.");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement.",
      );
    }
  };

  const handleSync = async () => {
    setStatus("syncing");
    setMessage("");
    try {
      const response = await fetch("/api/exchange-rate/eur-chf", { method: "POST" });
      const body = (await response.json()) as EcbRateResponse | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in body ? body.error : "Impossible de récupérer le cours BCE.",
        );
      }
      const data = body as EcbRateResponse;
      const normalizedRate = normalizeRateValue(data.rate);
      if (!normalizedRate) throw new Error("Le cours BCE reçu est invalide.");
      setRate(normalizedRate);
      setSavedRate(normalizedRate);
      setSource(data.source);
      setSourceDate(data.sourceDate);
      setUpdatedAt(data.updatedAt);
      setEditing(false);
      setStatus("saved");
      setMessage(`Cours BCE du ${formatSourceDate(data.sourceDate)} enregistré.`);
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour BCE.",
      );
    }
  };

  const isBusy = status === "saving" || status === "syncing";
  const sourceLabel =
    source === "ECB" && sourceDate
      ? `Source BCE, cours du ${formatSourceDate(sourceDate)}`
      : source === "manual"
        ? "Saisie manuelle"
        : "";
  const updateLabel = updatedAt
    ? `Mis à jour le ${formatUpdatedAt(updatedAt)}`
    : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">Taux de change EUR/CHF</p>
          <p className="text-xs text-slate-500">
            1 EUR = X CHF. Utilisé sur la page de partage pour convertir les prix CHF en EUR.
          </p>
          {(sourceLabel || updateLabel) && (
            <p className="mt-1 text-xs text-slate-500">
              {[sourceLabel, updateLabel].filter(Boolean).join(" · ")}
            </p>
          )}
          {message && (
            <p
              className={`mt-1 text-xs ${
                status === "error" ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={rate}
            onChange={(event) => {
              setRate(event.target.value);
              setStatus("idle");
              setMessage("");
            }}
            readOnly={!editing}
            disabled={status === "syncing"}
            className={`w-24 rounded-lg border px-3 py-2 text-right text-sm tabular-nums transition ${
              editing
                ? "border-slate-300 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                : "border-transparent bg-slate-50 text-slate-600"
            } disabled:opacity-60`}
            placeholder="0.93"
          />
          <button
            type="button"
            onClick={handleSync}
            disabled={isBusy}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {status === "syncing" ? "Mise à jour…" : "Cours BCE"}
          </button>
          {!editing ? (
            <button
              type="button"
              onClick={handleEdit}
              disabled={isBusy}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {status === "saved" ? "Enregistré" : "Modifier"}
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
