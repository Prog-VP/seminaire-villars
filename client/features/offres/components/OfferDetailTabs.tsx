import type { Offer } from "../types";
import { SUB_GROUPS, type SubGroupKey } from "./OfferMetaGrid";
import type { OfferDetailTab } from "./offer-detail-tabs";

type OfferDetailTabsProps = {
  offer: Offer;
  activeTab: OfferDetailTab;
  activeSection: SubGroupKey;
  isEditing: boolean;
  attachmentBadgeCount: number | null;
  commentsCount: number;
  onTabChange: (tab: OfferDetailTab) => void;
  onSectionChange: (section: SubGroupKey) => void;
};

const fullTabs: { key: OfferDetailTab; label: string }[] = [
  { key: "responses", label: "Hôtels" },
  { key: "document", label: "Document" },
  { key: "attachments", label: "Annexes" },
  { key: "comments", label: "Commentaires" },
];

const activityOnlyTabs: { key: OfferDetailTab; label: string }[] = [
  { key: "attachments", label: "Annexes" },
  { key: "comments", label: "Commentaires" },
];

export function OfferDetailTabs({
  offer,
  activeTab,
  activeSection,
  isEditing,
  attachmentBadgeCount,
  commentsCount,
  onTabChange,
  onSectionChange,
}: OfferDetailTabsProps) {
  const visibleGroups = offer.activiteUniquement
    ? SUB_GROUPS.filter((group) => group.key !== "seminaire")
    : SUB_GROUPS;
  const visibleTabs = offer.activiteUniquement ? activityOnlyTabs : fullTabs;

  return (
    <nav className="relative -mx-4 flex items-center overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
      <div className={`inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5 ${isEditing ? "pointer-events-none opacity-50" : ""}`}>
        {visibleGroups.map((group) => {
          const isActive = activeTab === "details" && activeSection === group.key;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => onSectionChange(group.key)}
              className={`whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:px-2.5 sm:text-sm ${
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

      <div className="mx-2 h-5 w-px shrink-0 bg-slate-200 sm:mx-3" />

      {visibleTabs.map(({ key, label }) => (
        <OfferDetailTabButton
          key={key}
          tabKey={key}
          label={label}
          isActive={activeTab === key}
          isEditing={isEditing}
          badge={getTabBadge(key, offer, attachmentBadgeCount, commentsCount)}
          onClick={onTabChange}
        />
      ))}
    </nav>
  );
}

function OfferDetailTabButton({
  tabKey,
  label,
  isActive,
  isEditing,
  badge,
  onClick,
}: {
  tabKey: OfferDetailTab;
  label: string;
  isActive: boolean;
  isEditing: boolean;
  badge: number | null;
  onClick: (tab: OfferDetailTab) => void;
}) {
  return (
    <button
      type="button"
      disabled={isEditing}
      onClick={() => onClick(tabKey)}
      className={`relative shrink-0 px-2.5 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
        isEditing
          ? "cursor-not-allowed text-slate-300"
          : isActive
            ? "text-brand-900"
            : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {label}
      {badge !== null ? (
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
}

function getTabBadge(
  tabKey: OfferDetailTab,
  offer: Offer,
  attachmentBadgeCount: number | null,
  commentsCount: number,
) {
  if (tabKey === "responses") return offer.hotelResponses?.length || null;
  if (tabKey === "attachments") return attachmentBadgeCount;
  if (tabKey === "comments") return commentsCount;
  return null;
}
