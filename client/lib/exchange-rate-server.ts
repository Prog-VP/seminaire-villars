import { createAdminClient } from "@/lib/supabase/admin";
import {
  EXCHANGE_RATE_CONFIG_KEYS,
  formatEurChfRateForStorage,
  type EcbEurChfRate,
} from "@/lib/exchange-rate";

export async function saveEcbEurChfRateToConfig(rate: EcbEurChfRate) {
  const updatedAt = new Date().toISOString();
  const rateValue = formatEurChfRateForStorage(rate.rate);
  const admin = createAdminClient();
  const { error } = await admin.from("app_config").upsert(
    [
      { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRate, value: rateValue },
      { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRateSource, value: rate.source },
      { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRateSourceDate, value: rate.sourceDate },
      { key: EXCHANGE_RATE_CONFIG_KEYS.eurChfRateUpdatedAt, value: updatedAt },
    ],
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);

  return {
    rate: rateValue,
    source: rate.source,
    sourceDate: rate.sourceDate,
    sourceUrl: rate.sourceUrl,
    updatedAt,
  };
}
