import { StatsDashboard } from "@/features/stats/components/StatsDashboard";
import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/features/offres/types";

export default async function StatsPage() {
  let offers: Offer[] = [];
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from("offers")
      .select("*, hotel_responses(*)")
      .order("createdAt", { ascending: false });

    if (dbError) throw new Error(dbError.message);

    offers = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      societeContact: row.societeContact as string,
      dateEnvoiOffre: (row.dateEnvoiOffre as string) ?? null,
      typeSociete: (row.typeSociete as string) ?? "",
      pays: (row.pays as string) ?? "",
      emailContact: row.emailContact as string | undefined,
      langue: row.langue as string | undefined,
      titreContact: row.titreContact as string | undefined,
      nomContact: row.nomContact as string | undefined,
      prenomContact: row.prenomContact as string | undefined,
      sejourDu: (row.sejourDu as string) ?? null,
      sejourAu: (row.sejourAu as string) ?? null,
      activitesVillarsDiablerets: row.activitesVillarsDiablerets as boolean | undefined,
      nombreDeNuits: row.nombreDeNuits as string | undefined,
      nombrePax: row.nombrePax as number | undefined,
      transmisPar: row.transmisPar as string | undefined,
      typeSejour: row.typeSejour as string | undefined,
      categorieHotel: row.categorieHotel as string | undefined,
      stationDemandee: row.stationDemandee as string | undefined,
      relanceEffectueeLe: (row.relanceEffectueeLe as string) ?? null,
      reservationEffectuee: row.reservationEffectuee as boolean | undefined,
      contactEntreDansBrevo: row.contactEntreDansBrevo as boolean | undefined,
      autres: row.autres as string | undefined,
      traitePar: row.traitePar as string | undefined,
      createdAt: row.createdAt as string | undefined,
      updatedAt: row.updatedAt as string | undefined,
      shareToken: (row.shareToken as string) ?? null,
      hotelResponses: Array.isArray(row.hotel_responses)
        ? (row.hotel_responses as Record<string, unknown>[]).map((r) => ({
            id: r.id as string,
            hotelName: r.hotelName as string,
            respondentName: r.respondentName as string | undefined,
            message: r.message as string,
            createdAt: r.createdAt as string | undefined,
          }))
        : [],
    }));
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Impossible de charger les statistiques.";
  }

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorMessage message={error} />
      ) : (
        <StatsDashboard offers={offers} />
      )}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </div>
  );
}
