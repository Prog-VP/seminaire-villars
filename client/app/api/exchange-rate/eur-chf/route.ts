import { NextResponse } from "next/server";
import { fetchEcbEurChfRate } from "@/lib/exchange-rate";
import { saveEcbEurChfRateToConfig } from "@/lib/exchange-rate-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    return NextResponse.json(await fetchEcbEurChfRate());
  } catch (error) {
    console.error("[exchange-rate/eur-chf][GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const rate = await fetchEcbEurChfRate();
    return NextResponse.json(await saveEcbEurChfRateToConfig(rate));
  } catch (error) {
    console.error("[exchange-rate/eur-chf][POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne." },
      { status: 500 },
    );
  }
}
