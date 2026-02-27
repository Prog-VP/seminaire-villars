import { BackButton } from "@/components/navigation/BackButton";
import { OfferDetail } from "@/features/offres/components/OfferDetail";
import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/features/offres/types";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({
  params,
}: OfferDetailPageProps) {
  const { id } = await params;

  let offer: Offer | null = null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*, hotel_responses(*), offer_comments(*)")
    .eq("id", id)
    .single();

  if (!error && data) {
    offer = {
      id: data.id as string,
      societeContact: data.societeContact as string,
      dateEnvoiOffre: (data.dateEnvoiOffre as string) ?? null,
      typeSociete: (data.typeSociete as string) ?? "",
      pays: (data.pays as string) ?? "",
      emailContact: data.emailContact as string | undefined,
      langue: data.langue as string | undefined,
      titreContact: data.titreContact as string | undefined,
      nomContact: data.nomContact as string | undefined,
      prenomContact: data.prenomContact as string | undefined,
      sejourDu: (data.sejourDu as string) ?? null,
      sejourAu: (data.sejourAu as string) ?? null,
      activitesVillarsDiablerets: data.activitesVillarsDiablerets as boolean | undefined,
      nombreDeNuits: data.nombreDeNuits as string | undefined,
      nombrePax: data.nombrePax as number | undefined,
      transmisPar: data.transmisPar as string | undefined,
      typeSejour: data.typeSejour as string | undefined,
      categorieHotel: data.categorieHotel as string | undefined,
      stationDemandee: data.stationDemandee as string | undefined,
      relanceEffectueeLe: (data.relanceEffectueeLe as string) ?? null,
      reservationEffectuee: data.reservationEffectuee as boolean | undefined,
      contactEntreDansBrevo: data.contactEntreDansBrevo as boolean | undefined,
      autres: data.autres as string | undefined,
      traitePar: data.traitePar as string | undefined,
      createdAt: data.createdAt as string | undefined,
      updatedAt: data.updatedAt as string | undefined,
      shareToken: (data.shareToken as string) ?? null,
      hotelResponses: Array.isArray(data.hotel_responses)
        ? (data.hotel_responses as Record<string, unknown>[]).map((r) => ({
            id: r.id as string,
            hotelName: r.hotelName as string,
            respondentName: r.respondentName as string | undefined,
            message: r.message as string,
            createdAt: r.createdAt as string | undefined,
          }))
        : [],
      comments: Array.isArray(data.offer_comments)
        ? (data.offer_comments as Record<string, unknown>[]).map((c) => ({
            id: c.id as string,
            author: c.author as string,
            content: c.content as string,
            date: c.date as string | undefined,
            createdAt: c.createdAt as string | undefined,
          }))
        : [],
    };
  }

  return (
    <div className="space-y-6">
      <BackButton href="/offres" />
      <OfferDetail offer={offer ?? undefined} />
    </div>
  );
}
