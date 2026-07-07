export const ECB_EUROFXREF_DAILY_URL =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export const EXCHANGE_RATE_CONFIG_KEYS = {
  eurChfRate: "chf_eur_rate",
  eurChfRateSource: "chf_eur_rate_source",
  eurChfRateSourceDate: "chf_eur_rate_source_date",
  eurChfRateUpdatedAt: "chf_eur_rate_updated_at",
} as const;

export type EcbEurChfRate = {
  rate: number;
  source: "ECB";
  sourceDate: string;
  sourceUrl: string;
};

function readXmlAttribute(tag: string, attribute: string) {
  const match = tag.match(new RegExp(`${attribute}=['"]([^'"]+)['"]`));
  return match?.[1] ?? null;
}

export function parseEcbEurChfRate(xml: string): EcbEurChfRate {
  const timeTag = xml.match(/<Cube\b[^>]*time=['"][^'"]+['"][^>]*>/)?.[0];
  const chfTag = xml.match(/<Cube\b[^>]*currency=['"]CHF['"][^>]*\/?>/)?.[0];

  const sourceDate = timeTag ? readXmlAttribute(timeTag, "time") : null;
  const rateValue = chfTag ? readXmlAttribute(chfTag, "rate") : null;
  const rate = rateValue ? Number.parseFloat(rateValue) : Number.NaN;

  if (!sourceDate || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Cours EUR/CHF introuvable dans le flux BCE.");
  }

  return {
    rate,
    source: "ECB",
    sourceDate,
    sourceUrl: ECB_EUROFXREF_DAILY_URL,
  };
}

export async function fetchEcbEurChfRate(): Promise<EcbEurChfRate> {
  const response = await fetch(ECB_EUROFXREF_DAILY_URL, {
    cache: "no-store",
    headers: { accept: "application/xml, text/xml" },
  });

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le cours BCE (${response.status}).`);
  }

  return parseEcbEurChfRate(await response.text());
}

export function formatEurChfRateForStorage(rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Taux EUR/CHF invalide.");
  }

  return rate.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
