import { describe, it, expect } from "vitest";
import {
  normalizeStatut,
  formatStars,
  getEffectiveDates,
  computeNights,
  getStatutBadgeStyle,
  buildAvailableOfferText,
  parseHotelResponseMessage,
} from "@/features/offres/utils";

// ---------------------------------------------------------------------------
// normalizeStatut
// ---------------------------------------------------------------------------

describe("normalizeStatut", () => {
  it("converts legacy keys to labels", () => {
    expect(normalizeStatut("brouillon")).toBe("Brouillon");
    expect(normalizeStatut("envoye")).toBe("Envoyé");
    expect(normalizeStatut("refuse")).toBe("Refusé");
    expect(normalizeStatut("confirme")).toBe("Confirmé");
  });

  it("returns new-style labels as-is", () => {
    expect(normalizeStatut("Brouillon")).toBe("Brouillon");
    expect(normalizeStatut("Custom Status")).toBe("Custom Status");
  });

  it("returns default for null/undefined/empty", () => {
    expect(normalizeStatut(null)).toBe("Brouillon");
    expect(normalizeStatut(undefined)).toBe("Brouillon");
    expect(normalizeStatut("")).toBe("Brouillon");
  });
});

// ---------------------------------------------------------------------------
// formatStars
// ---------------------------------------------------------------------------

describe("formatStars", () => {
  it("converts star ratings", () => {
    expect(formatStars("1*")).toBe("★");
    expect(formatStars("3*")).toBe("★★★");
    expect(formatStars("5*")).toBe("★★★★★");
  });

  it("returns non-star values as-is", () => {
    expect(formatStars("Luxe")).toBe("Luxe");
    expect(formatStars("3 étoiles")).toBe("3 étoiles");
    expect(formatStars("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getEffectiveDates
// ---------------------------------------------------------------------------

describe("getEffectiveDates", () => {
  it("prefers confirmed dates", () => {
    const result = getEffectiveDates({
      dateConfirmeeDu: "2024-03-01",
      dateConfirmeeAu: "2024-03-05",
      dateOptions: [{ du: "2024-04-01", au: "2024-04-05" }],
    });
    expect(result).toEqual({ du: "2024-03-01", au: "2024-03-05" });
  });

  it("falls back to first date option", () => {
    const result = getEffectiveDates({
      dateOptions: [
        { du: "2024-04-01", au: "2024-04-05" },
        { du: "2024-05-01", au: "2024-05-05" },
      ],
    });
    expect(result).toEqual({ du: "2024-04-01", au: "2024-04-05" });
  });

  it("returns null when no dates", () => {
    expect(getEffectiveDates({})).toEqual({ du: null, au: null });
    expect(getEffectiveDates({ dateOptions: [] })).toEqual({ du: null, au: null });
  });
});

// ---------------------------------------------------------------------------
// computeNights
// ---------------------------------------------------------------------------

describe("computeNights", () => {
  it("computes difference in nights", () => {
    expect(computeNights("2024-03-01", "2024-03-05")).toBe(4);
    expect(computeNights("2024-03-01", "2024-03-02")).toBe(1);
  });

  it("returns null for same date", () => {
    expect(computeNights("2024-03-01", "2024-03-01")).toBeNull();
  });

  it("returns null for reversed dates", () => {
    expect(computeNights("2024-03-05", "2024-03-01")).toBeNull();
  });

  it("returns null for missing dates", () => {
    expect(computeNights(null, "2024-03-01")).toBeNull();
    expect(computeNights("2024-03-01", null)).toBeNull();
    expect(computeNights(null, null)).toBeNull();
  });

  it("returns null for invalid dates", () => {
    expect(computeNights("invalid", "2024-03-01")).toBeNull();
    expect(computeNights("2024-03-01", "invalid")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getStatutBadgeStyle
// ---------------------------------------------------------------------------

describe("getStatutBadgeStyle", () => {
  it("uses colorMap when available", () => {
    const style = getStatutBadgeStyle("Confirmé", ["Confirmé"], { "Confirmé": "emerald" });
    expect(style).toContain("emerald");
  });

  it("returns default grey when no color set", () => {
    const style = getStatutBadgeStyle("Confirmé", ["Confirmé"], { "Confirmé": null });
    expect(style).toContain("slate");
  });

  it("returns default grey without colorMap", () => {
    const style = getStatutBadgeStyle("Unknown", []);
    expect(style).toContain("slate");
  });
});

// ---------------------------------------------------------------------------
// buildAvailableOfferText
// ---------------------------------------------------------------------------

describe("buildAvailableOfferText", () => {
  it("keeps only available date option blocks", () => {
    const text = [
      "--- Option 1 ---",
      "Fermé / Pas de disponibilité",
      "",
      "--- Option 2 ---",
      "Dates disponibles: 01.06.2026 → 03.06.2026",
      "Chambres simples disponibles: 5/10",
    ].join("\n");

    const result = buildAvailableOfferText(text);

    expect(result).not.toContain("Option 1");
    expect(result).not.toContain("Pas de disponibilité");
    expect(result).toContain("Option 2");
    expect(result).toContain("Dates disponibles");
  });

  it("returns empty when all options are unavailable", () => {
    expect(buildAvailableOfferText("Pas de disponibilité pour les dates demandées")).toBe("");
    expect(buildAvailableOfferText("Closed / No availability")).toBe("");
  });

  it("keeps regular available or custom offer text unchanged", () => {
    const text = "Dates disponibles: 01.06.2026 → 03.06.2026\nCHF 250 / chambre";
    expect(buildAvailableOfferText(text)).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// parseHotelResponseMessage
// ---------------------------------------------------------------------------

describe("parseHotelResponseMessage", () => {
  it("detects included tourist tax", () => {
    const result = parseHotelResponseMessage("Taxe de séjour incluse dans le prix");
    expect(result.taxeIncluse).toBe(true);
  });
});
