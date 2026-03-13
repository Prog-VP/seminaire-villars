"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchOfferById,
  updateHotelResponse,
  deleteHotelResponse,
  updateOfferStatut,
  uploadOfferAttachment,
  deleteOfferAttachment,
  downloadOfferAttachment,
  addOfferComment,
  deleteOfferComment,
  deleteOffer,
} from "@/features/offres/api";
import { getErrorMessage } from "@/lib/format";
import { downloadBlob } from "@/lib/download";
import type { Offer, OfferAttachment, OfferComment } from "../types";

type Message = { type: "success" | "error"; text: string } | null;

type UseOfferOperationsOptions = {
  currentOffer: Offer | null;
  setCurrentOffer: React.Dispatch<React.SetStateAction<Offer | null>>;
  attachments: OfferAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<OfferAttachment[]>>;
  setComments: React.Dispatch<React.SetStateAction<OfferComment[]>>;
  setIsLoadingAttachments: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingComments: React.Dispatch<React.SetStateAction<boolean>>;
  message: Message;
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
};

export function useOfferOperations({
  currentOffer,
  setCurrentOffer,
  attachments,
  setAttachments,
  setComments,
  setIsLoadingAttachments,
  setIsLoadingComments,
  setMessage,
}: UseOfferOperationsOptions) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingResponse, setIsUpdatingResponse] = useState(false);
  const [isDeletingResponse, setIsDeletingResponse] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingOffer, setIsDeletingOffer] = useState(false);

  const handleDeleteOffer = async () => {
    if (!currentOffer || isDeletingOffer) return;
    const confirmed = window.confirm(
      "Supprimer cette offre ? Les réponses d'hôtels, les annexes et les commentaires seront également supprimés."
    );
    if (!confirmed) return;

    try {
      setIsDeletingOffer(true);
      setMessage(null);
      await deleteOffer(currentOffer.id);
      router.push("/offres");
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de supprimer l'offre pour le moment."),
      });
    } finally {
      setIsDeletingOffer(false);
    }
  };

  const handleRefreshResponses = async () => {
    if (!currentOffer) return;
    try {
      setIsRefreshing(true);
      const latest = await fetchOfferById(currentOffer.id);
      if (latest) {
        setCurrentOffer(latest);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Actualisation impossible, réessayez plus tard."),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUploadAttachments = async (files: FileList | File[]) => {
    if (!currentOffer || isUploadingAttachment || !files || files.length === 0) return;
    try {
      setIsUploadingAttachment(true);
      let latest = attachments;
      for (const file of Array.from(files)) {
        latest = await uploadOfferAttachment(currentOffer.id, file);
      }
      setAttachments(latest);
      setMessage({ type: "success", text: "Document(s) ajouté(s)." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible d'ajouter le document."),
      });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!currentOffer) return;
    try {
      setIsLoadingAttachments(true);
      const data = await deleteOfferAttachment(currentOffer.id, attachmentId);
      setAttachments(data);
      setMessage({ type: "success", text: "Annexe supprimée." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de supprimer l'annexe."),
      });
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: string) => {
    if (!currentOffer) return;
    try {
      const { blob, filename } = await downloadOfferAttachment(
        currentOffer.id,
        attachmentId
      );
      downloadBlob(blob, filename);
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de télécharger l'annexe."),
      });
    }
  };

  const handleAddComment = async (payload: {
    author: string;
    content: string;
    date?: string;
  }) => {
    if (isSubmittingComment || !currentOffer) return;
    try {
      setIsSubmittingComment(true);
      const data = await addOfferComment(currentOffer.id, payload);
      setComments(data);
      setCurrentOffer((prev) => (prev ? { ...prev, comments: data } : prev));
      setMessage({ type: "success", text: "Commentaire ajouté." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible d'ajouter le commentaire."),
      });
      throw error;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentOffer) return;
    try {
      setIsLoadingComments(true);
      const data = await deleteOfferComment(currentOffer.id, commentId);
      setComments(data);
      setCurrentOffer((prev) => (prev ? { ...prev, comments: data } : prev));
      setMessage({ type: "success", text: "Commentaire supprimé." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de supprimer le commentaire."),
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleUpdateResponse = async (
    responseId: string,
    payload: {
      hotelName: string;
      respondentName?: string;
      message: string;
      offerText?: string | null;
    }
  ) => {
    if (!currentOffer || isUpdatingResponse) return;
    try {
      setIsUpdatingResponse(true);
      const updated = await updateHotelResponse(currentOffer.id, responseId, payload);
      setCurrentOffer((prev) =>
        prev
          ? {
              ...prev,
              hotelResponses: updated.hotelResponses,
            }
          : prev
      );
      setMessage({ type: "success", text: "Réponse hôtel mise à jour." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de modifier la réponse pour le moment."),
      });
    } finally {
      setIsUpdatingResponse(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!currentOffer || isDeletingResponse) return;
    try {
      setIsDeletingResponse(true);
      const updated = await deleteHotelResponse(currentOffer.id, responseId);
      setCurrentOffer((prev) =>
        prev
          ? {
              ...prev,
              hotelResponses: updated.hotelResponses,
            }
          : prev
      );
      setMessage({ type: "success", text: "Réponse hôtel supprimée." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de supprimer la réponse pour le moment."),
      });
    } finally {
      setIsDeletingResponse(false);
    }
  };

  const handleStatusChange = async (next: string) => {
    if (!currentOffer) return;
    try {
      await updateOfferStatut(currentOffer.id, next);
      setCurrentOffer((prev) => (prev ? { ...prev, statut: next } : prev));
      setMessage({ type: "success", text: "Statut mis à jour." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de changer le statut."),
      });
    }
  };

  const loadResponses = async () => {
    if (!currentOffer) return;
    try {
      setIsRefreshing(true);
      const latest = await fetchOfferById(currentOffer.id);
      if (latest) {
        setCurrentOffer(latest);
      }
    } catch {
      // silent — will show stale data
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    isUpdatingResponse,
    isDeletingResponse,
    isUploadingAttachment,
    isSubmittingComment,
    isDeletingOffer,
    handleDeleteOffer,
    handleRefreshResponses,
    handleUploadAttachments,
    handleDeleteAttachment,
    handleDownloadAttachment,
    handleAddComment,
    handleDeleteComment,
    handleUpdateResponse,
    handleDeleteResponse,
    handleStatusChange,
    loadResponses,
  };
}
