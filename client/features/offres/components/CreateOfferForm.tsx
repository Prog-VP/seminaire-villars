"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/navigation/BackButton";
import { createOffer } from "../api";
import { OfferForm, defaultOfferFormValues, mapFormValuesToPayload } from "./OfferForm";

export function CreateOfferForm() {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);

  const handleSubmit = async (values: typeof defaultOfferFormValues) => {
    const payload = mapFormValuesToPayload(values);
    const offer = await createOffer(payload);
    router.push(`/offres/${offer.id}`);
  };

  const handleDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  return (
    <>
      <BackButton
        href="/offres"
        label="Retour aux offres"
        confirmMessage={isDirty ? "Vous avez des modifications non enregistrées. Quitter sans sauvegarder ?" : undefined}
      />
      <OfferForm
        initialValues={defaultOfferFormValues}
        onSubmit={handleSubmit}
        submitLabel="Créer l'offre"
        onCancel={() => router.back()}
        heading="Nouvelle offre"
        subheading="Complétez les informations pour enrichir le pipeline."
        showFollowUpFields={false}
        stepper
        onDirtyChange={handleDirtyChange}
      />
    </>
  );
}
