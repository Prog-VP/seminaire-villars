"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotifications } from "@/features/notifications/context";
import {
  fetchOfferById,
  fetchOfferHotelSends,
  updateHotelResponse,
  deleteHotelResponse,
  updateOfferStatut,
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
import { ShareDialog } from "./ShareDialog";
import { GenerateOfferDocTab } from "@/features/documents/components/GenerateOfferDocTab";
import type { Offer, OfferStatut, OfferAttachment, OfferComment, OfferHotelSend } from "../types";
import { getEffectiveDates, OFFER_STATUTS, STATUT_BADGE_STYLES, getStatutLabel } from "../utils";

type OfferDetailProps = {
  offer?: Offer | null;
};

const VALID_TABS = ["details", "responses", "attachments", "comments", "document"] as const;
type Tab = (typeof VALID_TABS)[number];

function parseTab(value: string | null): Tab {
  return VALID_TABS.includes(value as Tab) ? (value as Tab) : "details";
}

export function OfferDetail({ offer }: OfferDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { clearNotifications } = useNotifications();
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(offer ?? null);

  useEffect(() => {
    clearNotifications();
  }, [clearNotifications]);
  const [isEditing, setIsEditing] = useState(false);
  const activeTab = parseTab(searchParams.get("tab"));

  const setActiveTab = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "details") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
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
  const [sends, setSends] = useState<OfferHotelSend[]>([]);
  const [areSendsLoaded, setAreSendsLoaded] = useState(false);
  const attachmentBadgeCount = areAttachmentsLoaded
    ? attachments.length
    : currentOffer?.attachmentsCount ?? 0;

  const shareUrl = currentOffer?.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/partage/offres/${currentOffer.shareToken}`
    : null;

  const handleShareLink = () => {
    if (!currentOffer) return;
    setActiveTab("responses");
    setIsShareDialogOpen(true);
  };

  const loadSends = useCallback(async () => {
    if (!currentOffer) return;
    try {
      const data = await fetchOfferHotelSends(currentOffer.id);
      setSends(data);
      setAreSendsLoaded(true);
    } catch {
      // silent — sends are supplementary info
    }
  }, [currentOffer]);

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
  if ((activeTab === "responses" || activeTab === "document") && !areSendsLoaded) {
    loadSends();
  }
}, [activeTab, areSendsLoaded, loadSends]);

// Auto-refresh hotel responses when entering the tab
const loadResponses = useCallback(async () => {
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
}, [currentOffer?.id]);

const initialTabSkipped = useRef(false);
useEffect(() => {
  if (activeTab === "details" || activeTab === "responses" || activeTab === "document") {
    if (!initialTabSkipped.current) {
      initialTabSkipped.current = true;
      return;
    }
    loadResponses();
  }
}, [activeTab, loadResponses]);

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
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier la réponse pour le moment.",
      });
    } finally {
      setIsUpdatingResponse(false);
    }
  };

  const handleUpdateOfferText = async (responseId: string, offerText: string) => {
    if (!currentOffer) return;
    const response = currentOffer.hotelResponses?.find((r) => r.id === responseId);
    if (!response) return;
    await handleUpdateResponse(responseId, {
      hotelName: response.hotelName,
      respondentName: response.respondentName,
      message: response.message,
      offerText: offerText || null,
    });
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Offre
              </span>
              <StatusChanger
                statut={currentOffer.statut ?? "brouillon"}
                onChange={async (next) => {
                  try {
                    await updateOfferStatut(currentOffer.id, next);
                    setCurrentOffer((prev) => prev ? { ...prev, statut: next } : prev);
                    setMessage({ type: "success", text: "Statut mis à jour." });
                  } catch (error) {
                    setMessage({
                      type: "error",
                      text: error instanceof Error ? error.message : "Impossible de changer le statut.",
                    });
                  }
                }}
              />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {currentOffer.societeContact}
            </h2>
            {currentOffer.numeroOffre && (
              <p className="text-xs font-medium text-slate-400">
                N° {currentOffer.numeroOffre}
              </p>
            )}
            <p className="text-sm text-slate-600">
              {[currentOffer.typeSociete, currentOffer.pays].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {currentOffer.stationDemandee && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {currentOffer.stationDemandee}
                </span>
              )}
              {currentOffer.langue && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {currentOffer.langue}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            {!isEditing && (
              <button
                type="button"
                onClick={() => { setActiveTab("details"); setIsEditing(true); }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Modifier
              </button>
            )}
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
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Dates
              {(currentOffer.dateOptions?.length ?? 0) > 1 && (
                <span className="ml-1 text-slate-300">
                  ({currentOffer.dateOptions!.length} options)
                </span>
              )}
            </p>
            {(() => {
              const eff = getEffectiveDates(currentOffer);
              return (
                <p className="text-base font-semibold text-slate-900">
                  {eff.du
                    ? `${new Date(eff.du).toLocaleDateString("fr-CH")} → ${
                        eff.au
                          ? new Date(eff.au).toLocaleDateString("fr-CH")
                          : "?"
                      }`
                    : "Non défini"}
                  {(currentOffer.dateConfirmeeDu || currentOffer.dateConfirmeeAu) && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Confirmée
                    </span>
                  )}
                </p>
              );
            })()}
            <p className="text-xs text-slate-500">
              {currentOffer.relanceEffectueeLe
                ? `Relancée le ${new Date(currentOffer.relanceEffectueeLe).toLocaleDateString("fr-CH")}`
                : ""}
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

      <nav className="relative flex border-b border-slate-200">
        {(currentOffer.activiteUniquement
          ? ["details", "attachments", "comments"]
          : ["details", "responses", "document", "attachments", "comments"]
        ).map((tabKey) => {
          const label =
            tabKey === "details"
              ? "Détails"
              : tabKey === "responses"
                ? "Hôtels"
                : tabKey === "document"
                  ? "Document"
                  : tabKey === "attachments"
                    ? "Annexes"
                    : "Commentaires";
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              type="button"
              disabled={isEditing && tabKey !== "details"}
              onClick={() => {
                if (isEditing) return;
                setActiveTab(tabKey as typeof activeTab);
              }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isEditing && tabKey !== "details"
                  ? "cursor-not-allowed text-slate-300"
                  : isActive
                    ? "text-brand-900"
                    : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
              {tabKey === "responses" && currentOffer.hotelResponses?.length ? (
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                    isActive
                      ? "bg-brand-900/10 text-brand-900"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {currentOffer.hotelResponses.length}
                </span>
              ) : null}
              {tabKey === "attachments" && attachmentBadgeCount ? (
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                    isActive
                      ? "bg-brand-900/10 text-brand-900"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {attachmentBadgeCount}
                </span>
              ) : null}
              {tabKey === "comments" && comments.length ? (
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                    isActive
                      ? "bg-brand-900/10 text-brand-900"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {comments.length}
                </span>
              ) : null}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-900" />
              )}
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
          sends={sends}
          shareUrl={shareUrl}
          onRefresh={handleRefreshResponses}
          isRefreshing={isRefreshing}
          onUpdateResponse={handleUpdateResponse}
          onDeleteResponse={handleDeleteResponse}
          isBusy={isDeletingResponse || isUpdatingResponse}
          onOpenShareDialog={() => setIsShareDialogOpen(true)}
        />
      ) : activeTab === "document" ? (
        <GenerateOfferDocTab
          offer={currentOffer}
          hotelResponses={currentOffer.hotelResponses}
          sends={sends}
          onUpdateOfferText={handleUpdateOfferText}
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

      {isShareDialogOpen && currentOffer && (
        <ShareDialog
          offer={currentOffer}
          onClose={() => {
            setIsShareDialogOpen(false);
            loadSends();
          }}
          onTokenCreated={(token) =>
            setCurrentOffer((prev) => (prev ? { ...prev, shareToken: token } : prev))
          }
        />
      )}

    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusChanger — inline dropdown to change the offer statut
// ---------------------------------------------------------------------------

function StatusChanger({
  statut,
  onChange,
}: {
  statut: OfferStatut;
  onChange: (next: OfferStatut) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const badgeClasses = STATUT_BADGE_STYLES[statut] ?? STATUT_BADGE_STYLES.brouillon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${badgeClasses}`}
      >
        {getStatutLabel(statut)}
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {OFFER_STATUTS.map((s) => {
            const isActive = s.value === statut;
            const dotClasses = STATUT_BADGE_STYLES[s.value];
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span className={`inline-block h-2 w-2 rounded-full ${dotClasses.split(" ")[0]}`} />
                <span className="flex-1">{s.label}</span>
                {isActive && (
                  <span className="text-emerald-600">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
