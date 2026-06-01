const HOTEL_TAG_STOPWORDS = new Set([
  "A",
  "AU",
  "AUX",
  "D",
  "DE",
  "DES",
  "DU",
  "ET",
  "L",
  "LA",
  "LE",
  "LES",
]);

function asciiUpper(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function normalizeHotelPptTag(value: string) {
  return asciiUpper(value)
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildHotelPptTag(name: string) {
  const parts = asciiUpper(name)
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part && !HOTEL_TAG_STOPWORDS.has(part));

  return parts.join("_") || "HOTEL";
}
