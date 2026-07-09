import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchEcbEurChfRate } from "@/lib/exchange-rate";
import { saveEcbEurChfRateToConfig } from "@/lib/exchange-rate-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const rate = await fetchEcbEurChfRate();
    return NextResponse.json(await saveEcbEurChfRateToConfig(rate));
  } catch (error) {
    console.error("[cron/update-eur-chf-rate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne." },
      { status: 500 },
    );
  }
}
