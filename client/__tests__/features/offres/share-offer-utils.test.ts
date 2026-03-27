import { describe, it, expect } from "vitest";
import {
  chfToEur,
  detectLang,
  isTemplateValid,
  type TemplateState,
} from "@/features/offres/components/share-offer-utils";

// ---------------------------------------------------------------------------
// chfToEur
// ---------------------------------------------------------------------------

describe("chfToEur", () => {
  it("converts CHF to EUR with rate", () => {
    expect(chfToEur("100", 0.92)).toBe("92.00");
    expect(chfToEur("50.5", 0.92)).toBe("46.46");
  });

  it("handles comma as decimal separator", () => {
    expect(chfToEur("100,50", 0.92)).toBe("92.46");
  });

  it("returns empty for zero", () => {
    expect(chfToEur("0", 0.92)).toBe("");
  });

  it("returns empty for non-numeric", () => {
    expect(chfToEur("", 0.92)).toBe("");
    expect(chfToEur("abc", 0.92)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// detectLang
// ---------------------------------------------------------------------------

describe("detectLang", () => {
  it("detects French", () => {
    expect(detectLang("Français")).toBe("fr");
    expect(detectLang(null)).toBe("fr");
    expect(detectLang(undefined)).toBe("fr");
  });

  it("detects English", () => {
    expect(detectLang("Anglais")).toBe("en");
    expect(detectLang("English")).toBe("en");
  });

  it("detects German", () => {
    expect(detectLang("Allemand")).toBe("de");
    expect(detectLang("Deutsch")).toBe("de");
    expect(detectLang("German")).toBe("de");
  });

  it("defaults to French for unknown", () => {
    expect(detectLang("Espagnol")).toBe("fr");
  });
});

// ---------------------------------------------------------------------------
// isTemplateValid
// ---------------------------------------------------------------------------

describe("isTemplateValid", () => {
  const baseDateResponse = {
    dateFrom: "", dateTo: "",
    roomsSimple: "", roomsDouble: "",
    priceSimpleChf: "", priceDoubleChf: "",
    demiPensionChf: "", pensionCompleteChf: "",
    forfaitJourneeChf: "", forfaitDemiJourneeChf: "",
    taxeChf: "", commentaire: "",
    disponible: false,
  };

  it("returns true when at least one date is disponible", () => {
    const state: TemplateState = {
      dateResponses: [{ ...baseDateResponse, disponible: true }],
      commentaireGeneral: "",
    };
    expect(isTemplateValid(state)).toBe(true);
  });

  it("returns false when all dates are closed", () => {
    const state: TemplateState = {
      dateResponses: [
        { ...baseDateResponse, disponible: false },
        { ...baseDateResponse, disponible: false },
      ],
      commentaireGeneral: "",
    };
    expect(isTemplateValid(state)).toBe(false);
  });

  it("returns false for empty responses", () => {
    const state: TemplateState = { dateResponses: [], commentaireGeneral: "" };
    expect(isTemplateValid(state)).toBe(false);
  });
});
