"use client";

import { useRouter } from "next/navigation";
import { createOffer } from "../api";
import { OfferForm, defaultOfferFormValues, mapFormValuesToPayload } from "./OfferForm";

export function CreateOfferForm() {
  const router = useRouter();

  const handleSubmit = async (values: typeof defaultOfferFormValues) => {
    const payload = mapFormValuesToPayload(values);
    const offer = await createOffer(payload);
    router.push(`/offres/${offer.id}`);
  };

  return (
    <OfferForm
      initialValues={defaultOfferFormValues}
      onSubmit={handleSubmit}
      submitLabel="Créer l'offre"
      onCancel={() => router.back()}
      heading="Nouvelle offre"
      subheading="Complétez les informations pour enrichir le pipeline."
      showFollowUpFields={false}
    />
  );
}
