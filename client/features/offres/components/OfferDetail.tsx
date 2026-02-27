"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createShareLink,
  fetchOfferById,
  updateHotelResponse,
  deleteHotelResponse,
  listOfferAttachments,
  uploadOfferAttachment,
  deleteOfferAttachment,
  downloadOfferAttachment,
  listOfferComments,
  addOfferComment,
  deleteOfferComment,
  deleteOffer,
} from "@/features/offres/api";
import { EditOfferForm } from "./EditOfferForm";
import { OfferMetaGrid } from "./OfferMetaGrid";
import { HotelResponsesPanel } from "./HotelResponsesPanel";
import { OfferAttachmentsPanel } from "./OfferAttachmentsPanel";
import { OfferCommentsPanel } from "./OfferCommentsPanel";
import type { Offer, OfferAttachment, OfferComment } from "../types";

type OfferDetailProps = {
  offer?: Offer | null;
};

export function OfferDetail({ offer }: OfferDetailProps) {
  const router = useRouter();
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(offer ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "responses" | "attachments" | "comments">(
    "details"
  );
  const [isSharing, setIsSharing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingResponse, setIsUpdatingResponse] = useState(false);
  const [isDeletingResponse, setIsDeletingResponse] = useState(false);
  const [attachments, setAttachments] = useState<OfferAttachment[]>([]);
  const [areAttachmentsLoaded, setAreAttachmentsLoaded] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [comments, setComments] = useState<OfferComment[]>(offer?.comments ?? []);
  const [areCommentsLoaded, setAreCommentsLoaded] = useState(
    Array.isArray(offer?.comments)
  );
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingOffer, setIsDeletingOffer] = useState(false);
  const attachmentBadgeCount = areAttachmentsLoaded
    ? attachments.length
    : currentOffer?.attachmentsCount ?? 0;

  const handleShareLink = async () => {
    if (!currentOffer) return;
    try {
      setIsSharing(true);
      setMessage(null);
      const { shareUrl, token } = await createShareLink(currentOffer.id);
      setCurrentOffer((prev) => (prev ? { ...prev, shareToken: token } : prev));

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setMessage({ type: "success", text: "Lien copié dans le presse-papiers." });
      } else {
        setMessage({ type: "success", text: `Lien prêt : ${shareUrl}` });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de générer le lien pour le moment.",
      });
    } finally {
      setIsSharing(false);
    }
  };

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
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer l'offre pour le moment.",
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
        text:
          error instanceof Error
            ? error.message
            : "Actualisation impossible, réessayez plus tard.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadAttachments = useCallback(async () => {
    if (!currentOffer) return;
    try {
      setIsLoadingAttachments(true);
      const data = await listOfferAttachments(currentOffer.id);
      setAttachments(data);
      setAreAttachmentsLoaded(true);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de charger les annexes pour le moment.",
      });
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [currentOffer, setMessage]);

useEffect(() => {
  if (activeTab === "attachments" && !areAttachmentsLoaded) {
    loadAttachments();
  }
}, [activeTab, areAttachmentsLoaded, loadAttachments]);

useEffect(() => {
  if (currentOffer?.comments) {
    setComments(currentOffer.comments);
    setAreCommentsLoaded(true);
  }
}, [currentOffer?.comments]);

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
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter le document.",
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
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer l'annexe.",
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de télécharger l'annexe.",
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
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter le commentaire.",
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
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le commentaire.",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadComments = useCallback(async () => {
    if (!currentOffer) return;
    try {
      setIsLoadingComments(true);
      const data = await listOfferComments(currentOffer.id);
      setComments(data);
      setAreCommentsLoaded(true);
      setCurrentOffer((prev) => (prev ? { ...prev, comments: data } : prev));
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de charger les commentaires.",
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, [currentOffer]);

  useEffect(() => {
    if (activeTab === "comments" && !areCommentsLoaded) {
      loadComments();
    }
  }, [activeTab, areCommentsLoaded, loadComments]);

  const handleUpdateResponse = async (
    responseId: string,
    payload: {
      hotelName: string;
      respondentName?: string;
      message: string;
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
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier la réponse pour le moment.",
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
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer la réponse pour le moment.",
      });
    } finally {
      setIsDeletingResponse(false);
    }
  };

  if (!currentOffer) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Offre introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
        <div className="flex flex-wrap items-start gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Offre
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">
              {currentOffer.societeContact}
            </h2>
            <p className="text-sm text-slate-600">
              {currentOffer.typeSociete} · {currentOffer.pays}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Modifier
              </button>
            )}
            <button
              type="button"
              onClick={handleShareLink}
              className="rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:from-slate-800 hover:to-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSharing}
            >
              {isSharing ? "Génération…" : "Partager l'offre"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Contact principal
            </p>
            <p className="text-base font-medium text-slate-900">
              {[currentOffer.titreContact, currentOffer.prenomContact, currentOffer.nomContact]
                .filter(Boolean)
                .join(" ") || "Non renseigné"}
            </p>
            <p className="text-xs text-slate-500">
              {currentOffer.emailContact || "Email inconnu"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Type de séjour
            </p>
            <p className="text-base font-semibold text-slate-900">
              {currentOffer.typeSejour || "Non défini"}
            </p>
            <p className="text-xs text-slate-500">
              {currentOffer.nombrePax
                ? `${currentOffer.nombrePax} participant${currentOffer.nombrePax > 1 ? "s" : ""}`
                : "Participants inconnus"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Dates</p>
            <p className="text-base font-semibold text-slate-900">
              {currentOffer.sejourDu
                ? `${new Date(currentOffer.sejourDu).toLocaleDateString("fr-CH")} → ${
                    currentOffer.sejourAu
                      ? new Date(currentOffer.sejourAu).toLocaleDateString("fr-CH")
                      : "?"
                  }`
                : "Non défini"}
            </p>
            <p className="text-xs text-slate-500">
              {currentOffer.dateEnvoiOffre
                ? `Envoyée le ${new Date(currentOffer.dateEnvoiOffre).toLocaleDateString("fr-CH")}`
                : "Pas encore envoyée"}
            </p>
          </div>
        </div>
        {message && (
          <p
            className={`mt-4 inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <nav className="flex flex-wrap gap-1">
        {["details", "responses", "attachments", "comments"].map((tabKey) => {
          const label =
            tabKey === "details"
              ? "Détails"
              : tabKey === "responses"
                ? "Réponses hôtels"
                : tabKey === "attachments"
                  ? "Annexes"
                  : "Commentaires";
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey as typeof activeTab)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {label}
              {tabKey === "responses" && currentOffer.hotelResponses?.length ? (
                <span
                  className={`ml-1.5 rounded-md px-1.5 text-xs font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {currentOffer.hotelResponses.length}
                </span>
              ) : null}
              {tabKey === "attachments" && attachmentBadgeCount ? (
                <span
                  className={`ml-1.5 rounded-md px-1.5 text-xs font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {attachmentBadgeCount}
                </span>
              ) : null}
              {tabKey === "comments" && comments.length ? (
                <span
                  className={`ml-1.5 rounded-md px-1.5 text-xs font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {comments.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {activeTab === "details" ? (
        isEditing ? (
          <EditOfferForm
            offer={currentOffer}
            onCancel={() => setIsEditing(false)}
            onSuccess={(updated) => {
              setCurrentOffer(updated);
              setIsEditing(false);
            }}
            onDelete={handleDeleteOffer}
            isDeleting={isDeletingOffer}
          />
        ) : (
          <OfferMetaGrid
            offer={currentOffer}
            attachmentsCount={
              areAttachmentsLoaded
                ? attachments.length
                : currentOffer.attachmentsCount
            }
          />
        )
      ) : activeTab === "responses" ? (
        <HotelResponsesPanel
          responses={currentOffer.hotelResponses}
          onRefresh={handleRefreshResponses}
          isRefreshing={isRefreshing}
          onUpdateResponse={handleUpdateResponse}
          onDeleteResponse={handleDeleteResponse}
          isBusy={isDeletingResponse || isUpdatingResponse}
        />
      ) : activeTab === "attachments" ? (
        <OfferAttachmentsPanel
          attachments={attachments}
          onUpload={handleUploadAttachments}
          onDelete={handleDeleteAttachment}
          onDownload={handleDownloadAttachment}
          isLoading={isLoadingAttachments || isUploadingAttachment}
        />
      ) : (
        <OfferCommentsPanel
          comments={comments}
          onAdd={handleAddComment}
          onDelete={handleDeleteComment}
          isLoading={isLoadingComments}
          isSubmitting={isSubmittingComment}
        />
      )}
    </div>
  );
}
