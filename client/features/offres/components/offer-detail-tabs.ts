export const OFFER_DETAIL_TABS = ["details", "responses", "attachments", "comments", "document"] as const;

export type OfferDetailTab = (typeof OFFER_DETAIL_TABS)[number];

export function parseOfferDetailTab(value: string | null): OfferDetailTab {
  return OFFER_DETAIL_TABS.includes(value as OfferDetailTab) ? (value as OfferDetailTab) : "details";
}
