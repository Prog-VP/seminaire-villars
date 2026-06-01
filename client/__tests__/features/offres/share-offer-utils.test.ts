import { describe, it, expect } from "vitest";
import {
  chfToEur,
  detectLang,
  isTemplateValid,
  buildTemplateMessage,
  createDateOptionResponse,
  type TemplateState,
} from "@/features/offres/components/share-offer-utils";

// ---------------------------------------------------------------------------
// chfToEur
// ---------------------------------------------------------------------------

describe("chfToEur", () => {
  it("converts CHF to EUR with a EUR to CHF rate", () => {
    expect(chfToEur("100", 0.93)).toBe("107.53");
    expect(chfToEur("50.5", 0.93)).toBe("54.30");
    expect(chfToEur("180", 0.93)).toBe("193.55");
  });

  it("normalizes inverted CHF to EUR rates", () => {
    expect(chfToEur("180", 1.075)).toBe("193.50");
  });

  it("handles comma as decimal separator", () => {
    expect(chfToEur("100,50", 0.93)).toBe("108.06");
  });

  it("returns empty for zero", () => {
    expect(chfToEur("0", 0.93)).toBe("");
  });

  it("returns empty for non-numeric", () => {
    expect(chfToEur("", 0.93)).toBe("");
    expect(chfToEur("abc", 0.93)).toBe("");
  });

  it("returns empty for invalid rates", () => {
    expect(chfToEur("100", 0)).toBe("");
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

// ---------------------------------------------------------------------------
// buildTemplateMessage — demi-pension / pension complète conditionals
// ---------------------------------------------------------------------------

describe("buildTemplateMessage", () => {
  const baseOpts = {
    showSimple: false,
    showDouble: false,
    showSeminaire: false,
    showJournee: false,
    showDemiJournee: false,
    activiteUniquement: false,
    showDemiPension: false,
    showPensionComplete: false,
  };

  function makeState(overrides: Partial<ReturnType<typeof createDateOptionResponse>> = {}): TemplateState {
    return {
      dateResponses: [{ ...createDateOptionResponse("2025-06-01", "2025-06-03"), ...overrides }],
      commentaireGeneral: "",
    };
  }

  it("includes demi-pension line when showDemiPension is true and value filled", () => {
    const msg = buildTemplateMessage(
      makeState({ demiPensionChf: "25" }),
      "fr", 0.92,
      { ...baseOpts, showDemiPension: true },
    );
    expect(msg).toContain("demi-pension");
    expect(msg).toContain("CHF 25");
  });

  it("excludes demi-pension line when showDemiPension is false", () => {
    const msg = buildTemplateMessage(
      makeState({ demiPensionChf: "25" }),
      "fr", 0.92,
      { ...baseOpts, showDemiPension: false },
    );
    expect(msg).not.toContain("demi-pension");
  });

  it("includes pension complète line when showPensionComplete is true and value filled", () => {
    const msg = buildTemplateMessage(
      makeState({ pensionCompleteChf: "50" }),
      "fr", 0.92,
      { ...baseOpts, showPensionComplete: true },
    );
    expect(msg).toContain("pension complète");
    expect(msg).toContain("CHF 50");
  });

  it("excludes pension complète line when showPensionComplete is false", () => {
    const msg = buildTemplateMessage(
      makeState({ pensionCompleteChf: "50" }),
      "fr", 0.92,
      { ...baseOpts, showPensionComplete: false },
    );
    expect(msg).not.toContain("pension complète");
  });

  it("shows all closed message when no date is available", () => {
    const state: TemplateState = {
      dateResponses: [{ ...createDateOptionResponse("2025-06-01", "2025-06-03"), disponible: false }],
      commentaireGeneral: "",
    };
    const msg = buildTemplateMessage(state, "fr", 0.92, baseOpts);
    expect(msg).not.toContain("CHF");
  });
});
