"use client";

import { OfferForm, mapFormValuesToPayload, mapOfferToFormValues } from "./OfferForm";
import type { Offer } from "../types";
import { updateOffer } from "../api";

type EditOfferFormProps = {
  offer: Offer;
  onCancel: () => void;
  onSuccess: (offer: Offer) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  initialSection?: string;
};

export function EditOfferForm({
  offer,
  onCancel,
  onSuccess,
  onDelete,
  isDeleting = false,
  initialSection,
}: EditOfferFormProps) {
  const handleSubmit = async (values: ReturnType<typeof mapOfferToFormValues>) => {
    const payload = mapFormValuesToPayload(values);
    const updated = await updateOffer(offer.id, payload);
    onSuccess(updated);
  };

  return (
    <OfferForm
      initialValues={mapOfferToFormValues(offer)}
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      onCancel={onCancel}
      heading="Modifier l'offre"
      subheading="Mettez à jour les informations et sauvegardez."
      onDelete={onDelete}
      deleteLabel="Supprimer l'offre"
      isDeleteLoading={isDeleting}
      initialSection={initialSection}
    />
  );
}
