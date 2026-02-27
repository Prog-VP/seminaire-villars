import { BackButton } from "@/components/navigation/BackButton";
import { CreateOfferForm } from "@/features/offres/components/CreateOfferForm";

export default function NouvelleOffrePage() {
  return (
    <div className="space-y-6">
      <BackButton href="/offres" label="Retour aux offres" />
      <CreateOfferForm />
    </div>
  );
}
