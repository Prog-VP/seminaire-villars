"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTabData } from "../hooks/useTabData";
import { useNotifications } from "@/features/notifications/context";
import { useOfferOperations } from "../hooks/useOfferOperations";
import {
  fetchOfferById,
  fetchOfferHotelSends,
  listOfferAttachments,
  listOfferComments,
} from "@/features/offres/api";
import { BackButton } from "@/components/navigation/BackButton";
import { EditOfferForm } from "./EditOfferForm";
import { OfferMetaGrid, parseSection, type SubGroupKey } from "./OfferMetaGrid";
import { OfferDetailHeader } from "./OfferDetailHeader";
import { OfferDetailTabs } from "./OfferDetailTabs";
import { HotelResponsesPanel } from "./HotelResponsesPanel";
import { OfferAttachmentsPanel } from "./OfferAttachmentsPanel";
import { OfferCommentsPanel } from "./OfferCommentsPanel";
import { ShareDialog } from "./ShareDialog";
import { OfferNavArrows } from "./OfferNavArrows";
import { GenerateOfferDocTab } from "@/features/documents/components/GenerateOfferDocTab";
import { getErrorMessage } from "@/lib/format";
import type { Offer, OfferAttachment, OfferComment, OfferHotelSend } from "../types";
import { parseOfferDetailTab, type OfferDetailTab } from "./offer-detail-tabs";

type OfferDetailProps = {
  offer?: Offer | null;
  offerId?: string;
};

export function OfferDetail({ offer, offerId }: OfferDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { notifications, markAsRead } = useNotifications();
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(offer ?? null);

  // Mark notifications for this offer as read
  useEffect(() => {
    if (!currentOffer) return;
    for (const n of notifications) {
      if (!n.isRead && n.offerId === currentOffer.id) markAsRead(n.id);
    }
  }, [currentOffer, notifications, markAsRead]);
  const [isEditing, setIsEditing] = useState(false);
  const activeTab = parseOfferDetailTab(searchParams.get("tab"));
  const activeSection = parseSection(searchParams.get("section"));
  const shouldLoadAttachments =
    activeTab === "attachments" || typeof currentOffer?.attachmentsCount !== "number";

  const navigate = useCallback(
    (tab: OfferDetailTab, section?: SubGroupKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "details") { params.delete("tab"); } else { params.set("tab", tab); }
      if (!section || section === "societe") { params.delete("section"); } else { params.set("section", section); }
      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setActiveTab = useCallback((tab: OfferDetailTab) => navigate(tab), [navigate]);
  const setActiveSection = useCallback((section: SubGroupKey) => navigate("details", section), [navigate]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const {
    data: attachments,
    setData: setAttachments,
    isLoaded: areAttachmentsLoaded,
    isLoading: isLoadingAttachments,
    setIsLoading: setIsLoadingAttachments,
  } = useTabData<OfferAttachment>({
    fetchFn: currentOffer ? () => listOfferAttachments(currentOffer.id) : null,
    triggerWhen: Boolean(currentOffer) && shouldLoadAttachments,
    onError: (error) =>
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de charger les annexes pour le moment."),
      }),
  });

  const {
    data: comments,
    setData: setComments,
    isLoading: isLoadingComments,
    setIsLoading: setIsLoadingComments,
  } = useTabData<OfferComment>({
    fetchFn: currentOffer ? () => listOfferComments(currentOffer.id) : null,
    initialData: offer?.comments ?? [],
    initiallyLoaded: Array.isArray(offer?.comments),
    triggerWhen: true,
    onError: (error) =>
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Impossible de charger les commentaires."),
      }),
  });

  const { data: sends, reload: reloadSends } = useTabData<OfferHotelSend>({
    fetchFn: currentOffer ? () => fetchOfferHotelSends(currentOffer.id) : null,
    triggerWhen: activeTab === "responses" || activeTab === "document",
  });
  const attachmentBadgeCount = areAttachmentsLoaded
    ? attachments.length
    : typeof currentOffer?.attachmentsCount === "number"
      ? currentOffer.attachmentsCount
      : null;

  const shareUrl = currentOffer?.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/partage/offres/${currentOffer.shareToken}`
    : null;

  const ops = useOfferOperations({
    currentOffer,
    setCurrentOffer,
    attachments,
    setAttachments,
    setComments,
    setIsLoadingAttachments,
    setIsLoadingComments,
    message,
    setMessage,
  });

  const offerIdToRefresh = currentOffer?.id;
  const initialTabSkipped = useRef(false);
  useEffect(() => {
    if (activeTab !== "details" && activeTab !== "responses" && activeTab !== "document") return;
    if (!offerIdToRefresh) return;
    if (!initialTabSkipped.current) {
      initialTabSkipped.current = true;
      return;
    }

    let isCancelled = false;
    void (async () => {
      try {
        const latest = await fetchOfferById(offerIdToRefresh);
        if (latest && !isCancelled) {
          setCurrentOffer(latest);
        }
      } catch {
        // Keep stale data if the background refresh fails.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, offerIdToRefresh]);

  useEffect(() => {
    if (currentOffer?.comments) {
      setComments(currentOffer.comments);
    }
  }, [currentOffer?.comments, setComments]);

  if (!currentOffer) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Offre introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton
          href="/offres"
          confirmMessage={isEditing ? "Vous avez des modifications non enregistrées. Quitter sans sauvegarder ?" : undefined}
        />
        {offerId && <OfferNavArrows currentId={offerId} confirmMessage={isEditing ? "Vous avez des modifications non enregistrées. Quitter sans sauvegarder ?" : undefined} />}
      </div>
      <OfferDetailHeader
        offer={currentOffer}
        comments={comments}
        isEditing={isEditing}
        onEdit={() => { navigate("details", activeSection); setIsEditing(true); }}
        onStatusChange={ops.handleStatusChange}
        onViewAllComments={() => setActiveTab("comments")}
        message={message}
      />

      <OfferDetailTabs
        offer={currentOffer}
        activeTab={activeTab}
        activeSection={activeSection}
        isEditing={isEditing}
        attachmentBadgeCount={attachmentBadgeCount}
        commentsCount={comments.length}
        onTabChange={setActiveTab}
        onSectionChange={setActiveSection}
      />

      {activeTab === "details" ? (
        isEditing ? (
          <EditOfferForm
            offer={currentOffer}
            onCancel={() => setIsEditing(false)}
            onSuccess={(updated) => {
              setCurrentOffer(updated);
              setIsEditing(false);
            }}
            onDelete={ops.handleDeleteOffer}
            isDeleting={ops.isDeletingOffer}
            initialSection={activeSection}
          />
        ) : (
          <OfferMetaGrid
            offer={currentOffer}
            attachmentsCount={
              areAttachmentsLoaded
                ? attachments.length
                : currentOffer.attachmentsCount
            }
            activeGroup={activeSection}
          />
        )
      ) : activeTab === "responses" ? (
        <HotelResponsesPanel
          responses={currentOffer.hotelResponses}
          sends={sends}
          shareUrl={shareUrl}
          onRefresh={ops.handleRefreshResponses}
          isRefreshing={ops.isRefreshing}
          onUpdateResponse={ops.handleUpdateResponse}
          onDeleteResponse={ops.handleDeleteResponse}
          isBusy={ops.isDeletingResponse || ops.isUpdatingResponse}
          onOpenShareDialog={() => setIsShareDialogOpen(true)}
        />
      ) : activeTab === "document" ? (
        <GenerateOfferDocTab
          offer={currentOffer}
          hotelResponses={currentOffer.hotelResponses}
        />
      ) : activeTab === "attachments" ? (
        <OfferAttachmentsPanel
          attachments={attachments}
          onUpload={ops.handleUploadAttachments}
          onDelete={ops.handleDeleteAttachment}
          onDownload={ops.handleDownloadAttachment}
          isLoading={isLoadingAttachments || ops.isUploadingAttachment}
        />
      ) : (
        <OfferCommentsPanel
          comments={comments}
          onAdd={ops.handleAddComment}
          onDelete={ops.handleDeleteComment}
          isLoading={isLoadingComments}
          isSubmitting={ops.isSubmittingComment}
        />
      )}

      {isShareDialogOpen && currentOffer && (
        <ShareDialog
          offer={currentOffer}
          onClose={() => {
            setIsShareDialogOpen(false);
            reloadSends();
          }}
          onTokenCreated={(token) =>
            setCurrentOffer((prev) => (prev ? { ...prev, shareToken: token } : prev))
          }
        />
      )}

    </div>
  );
}
