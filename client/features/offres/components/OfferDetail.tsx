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
import { OfferMetaGrid, SUB_GROUPS, parseSection, type SubGroupKey } from "./OfferMetaGrid";
import { OfferDetailHeader } from "./OfferDetailHeader";
import { HotelResponsesPanel } from "./HotelResponsesPanel";
import { OfferAttachmentsPanel } from "./OfferAttachmentsPanel";
import { OfferCommentsPanel } from "./OfferCommentsPanel";
import { ShareDialog } from "./ShareDialog";
import { OfferNavArrows } from "./OfferNavArrows";
import { GenerateOfferDocTab } from "@/features/documents/components/GenerateOfferDocTab";
import { getErrorMessage } from "@/lib/format";
import type { Offer, OfferAttachment, OfferComment, OfferHotelSend } from "../types";

type OfferDetailProps = {
  offer?: Offer | null;
  offerId?: string;
};

const VALID_TABS = ["details", "responses", "attachments", "comments", "document"] as const;
type Tab = (typeof VALID_TABS)[number];

function parseTab(value: string | null): Tab {
  return VALID_TABS.includes(value as Tab) ? (value as Tab) : "details";
}

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
  const activeTab = parseTab(searchParams.get("tab"));
  const activeSection = parseSection(searchParams.get("section"));

  const navigate = useCallback(
    (tab: Tab, section?: SubGroupKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "details") { params.delete("tab"); } else { params.set("tab", tab); }
      if (!section || section === "societe") { params.delete("section"); } else { params.set("section", section); }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setActiveTab = useCallback((tab: Tab) => navigate(tab), [navigate]);
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

      <nav className="relative flex items-center overflow-x-auto border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Detail sub-sections — pill group */}
        <div className={`inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5 ${isEditing ? "opacity-50 pointer-events-none" : ""}`}>
          {(currentOffer.activiteUniquement
            ? SUB_GROUPS.filter((g) => g.key !== "seminaire")
            : SUB_GROUPS
          ).map((group) => {
            const isActive = activeTab === "details" && activeSection === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => { setActiveSection(group.key); }}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-all whitespace-nowrap sm:px-2.5 sm:text-sm ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="mx-2 h-5 w-px shrink-0 bg-slate-200 sm:mx-3" />

        {/* Main tabs */}
        {(currentOffer.activiteUniquement
          ? [{ key: "attachments", label: "Annexes" }, { key: "comments", label: "Commentaires" }]
          : [{ key: "responses", label: "Hôtels" }, { key: "document", label: "Document" }, { key: "attachments", label: "Annexes" }, { key: "comments", label: "Commentaires" }]
        ).map(({ key: tabKey, label }) => {
          const isActive = activeTab === tabKey;
          const badge =
            tabKey === "responses" ? (currentOffer.hotelResponses?.length || null) :
            tabKey === "attachments" ? (attachmentBadgeCount || null) :
            tabKey === "comments" ? (comments.length || null) : null;
          return (
            <button
              key={tabKey}
              type="button"
              disabled={isEditing}
              onClick={() => setActiveTab(tabKey as Tab)}
              className={`relative shrink-0 px-2.5 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                isEditing
                  ? "cursor-not-allowed text-slate-300"
                  : isActive
                    ? "text-brand-900"
                    : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
              {badge ? (
                <span
                  className={`ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-semibold leading-none ${
                    isActive
                      ? "bg-brand-900/10 text-brand-900"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {badge}
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
