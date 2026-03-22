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
import { EditOfferForm } from "./EditOfferForm";
import { OfferMetaGrid } from "./OfferMetaGrid";
import { OfferDetailHeader } from "./OfferDetailHeader";
import { HotelResponsesPanel } from "./HotelResponsesPanel";
import { OfferAttachmentsPanel } from "./OfferAttachmentsPanel";
import { OfferCommentsPanel } from "./OfferCommentsPanel";
import { ShareDialog } from "./ShareDialog";
import { GenerateOfferDocTab } from "@/features/documents/components/GenerateOfferDocTab";
import { getErrorMessage } from "@/lib/format";
import type { Offer, OfferAttachment, OfferComment, OfferHotelSend } from "../types";

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

  const {
    data: attachments,
    setData: setAttachments,
    isLoaded: areAttachmentsLoaded,
    isLoading: isLoadingAttachments,
    setIsLoading: setIsLoadingAttachments,
  } = useTabData<OfferAttachment>({
    fetchFn: currentOffer ? () => listOfferAttachments(currentOffer.id) : null,
    triggerWhen: activeTab === "attachments",
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
    : currentOffer?.attachmentsCount ?? 0;

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

  const handleShareLink = () => {
    if (!currentOffer) return;
    setActiveTab("responses");
    setIsShareDialogOpen(true);
  };

// Auto-refresh hotel responses when entering the tab
const loadResponses = useCallback(async () => {
  if (!currentOffer) return;
  try {
    const latest = await fetchOfferById(currentOffer.id);
    if (latest) {
      setCurrentOffer(latest);
    }
  } catch {
    // silent — will show stale data
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
      <OfferDetailHeader
        offer={currentOffer}
        comments={comments}
        isEditing={isEditing}
        onEdit={() => { setActiveTab("details"); setIsEditing(true); }}
        onStatusChange={ops.handleStatusChange}
        onViewAllComments={() => setActiveTab("comments")}
        message={message}
      />

      <nav className="relative flex overflow-x-auto border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
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
              className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
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
            onDelete={ops.handleDeleteOffer}
            isDeleting={ops.isDeletingOffer}
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
          sends={sends}
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
