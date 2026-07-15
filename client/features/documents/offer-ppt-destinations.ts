export const OFFER_PPT_DESTINATIONS = ["VILLARS", "DIABLERETS"] as const;
export const OFFER_PPT_DESTINATION_MODES = ["auto", "villars", "diablerets", "both"] as const;

export type OfferPptDestination = (typeof OFFER_PPT_DESTINATIONS)[number];
export type OfferPptDestinationMode = (typeof OFFER_PPT_DESTINATION_MODES)[number];

const DESTINATION_LABELS: Record<OfferPptDestination, string> = {
  VILLARS: "Villars",
  DIABLERETS: "Les Diablerets",
};

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function orderedDestinations(destinations: Iterable<OfferPptDestination>) {
  const values = new Set(destinations);
  return OFFER_PPT_DESTINATIONS.filter((destination) => values.has(destination));
}

export function normalizeOfferPptDestinationMode(value: unknown): OfferPptDestinationMode {
  return OFFER_PPT_DESTINATION_MODES.includes(value as OfferPptDestinationMode)
    ? (value as OfferPptDestinationMode)
    : "auto";
}

export function normalizeOfferPptDestinations(value?: string | null): OfferPptDestination[] {
  const normalized = normalizeToken(value ?? "");
  if (!normalized) return [];
  if (normalized.includes("ALL") || normalized.includes("TOUS")) {
    return [...OFFER_PPT_DESTINATIONS];
  }

  const destinations = new Set<OfferPptDestination>();
  if (normalized.includes("VILLARS")) destinations.add("VILLARS");
  if (normalized.includes("DIABLER")) destinations.add("DIABLERETS");
  return orderedDestinations(destinations);
}

export function normalizeOfferPptDestinationValues(
  values: Iterable<string | null | undefined>
): OfferPptDestination[] {
  return orderedDestinations(
    [...values].flatMap((value) => normalizeOfferPptDestinations(value))
  );
}

export function resolveOfferPptDestinations({
  mode,
  hotelDestinations = [],
  offerDestination,
}: {
  mode?: unknown;
  hotelDestinations?: Iterable<string | null | undefined>;
  offerDestination?: string | null;
}): OfferPptDestination[] {
  const normalizedMode = normalizeOfferPptDestinationMode(mode);

  if (normalizedMode === "villars") return ["VILLARS"];
  if (normalizedMode === "diablerets") return ["DIABLERETS"];
  if (normalizedMode === "both") return [...OFFER_PPT_DESTINATIONS];

  const destinationsFromHotels = normalizeOfferPptDestinationValues(hotelDestinations);
  if (destinationsFromHotels.length > 0) return destinationsFromHotels;

  return normalizeOfferPptDestinations(offerDestination);
}

export function formatOfferPptDestinationLabel(destinations: OfferPptDestination[]) {
  if (destinations.length === 0) return "ALL";
  return destinations.map((destination) => DESTINATION_LABELS[destination]).join(", ");
}

export function formatOfferPptDestinationFilename(destinations: OfferPptDestination[]) {
  if (destinations.length === 0) return "";
  if (destinations.includes("VILLARS") && destinations.includes("DIABLERETS")) {
    return "Villars_Les_Diablerets";
  }
  if (destinations.includes("VILLARS")) return "Villars";
  return "Les_Diablerets";
}

export function areOfferPptDestinationsEqual(
  left: OfferPptDestination[],
  right: OfferPptDestination[]
) {
  const normalizedLeft = orderedDestinations(left);
  const normalizedRight = orderedDestinations(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((destination, index) => destination === normalizedRight[index])
  );
}
