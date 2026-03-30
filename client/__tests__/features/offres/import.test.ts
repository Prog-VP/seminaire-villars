import { describe, it, expect } from "vitest";
import {
  parseBool,
  parseInteger,
  parseString,
  parseDate,
  resolveHotelIds,
  parseRow,
  validateRow,
} from "@/features/offres/import";

// ---------------------------------------------------------------------------
// parseBool
// ---------------------------------------------------------------------------

describe("parseBool", () => {
  it.each([
    ["oui", true],
    ["Oui", true],
    ["yes", true],
    ["YES", true],
    ["1", true],
    ["true", true],
    ["vrai", true],
    ["x", true],
    ["X", true],
  ])('returns true for "%s"', (input, expected) => {
    expect(parseBool(input)).toBe(expected);
  });

  it.each([
    ["non", false],
    ["Non", false],
    ["no", false],
    ["0", false],
    ["false", false],
    ["faux", false],
  ])('returns false for "%s"', (input, expected) => {
    expect(parseBool(input)).toBe(expected);
  });

  it.each([undefined, null, ""])("returns undefined for %s", (input) => {
    expect(parseBool(input)).toBeUndefined();
  });

  it("returns undefined for unknown values", () => {
    expect(parseBool("maybe")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseInteger
// ---------------------------------------------------------------------------

describe("parseInteger", () => {
  it("parses integers", () => {
    expect(parseInteger(42)).toBe(42);
    expect(parseInteger("42")).toBe(42);
  });

  it("rounds floats", () => {
    expect(parseInteger(3.7)).toBe(4);
    expect(parseInteger("3.2")).toBe(3);
  });

  it.each([undefined, null, ""])("returns undefined for %s", (input) => {
    expect(parseInteger(input)).toBeUndefined();
  });

  it("returns undefined for non-numeric", () => {
    expect(parseInteger("abc")).toBeUndefined();
    expect(parseInteger(NaN)).toBeUndefined();
    expect(parseInteger(Infinity)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseString
// ---------------------------------------------------------------------------

describe("parseString", () => {
  it("trims and returns strings", () => {
    expect(parseString("  hello  ")).toBe("hello");
  });

  it("returns undefined for empty/null/undefined", () => {
    expect(parseString("")).toBeUndefined();
    expect(parseString(null)).toBeUndefined();
    expect(parseString(undefined)).toBeUndefined();
  });

  it("converts numbers to string", () => {
    expect(parseString(42)).toBe("42");
  });
});

// ---------------------------------------------------------------------------
// parseDate
// ---------------------------------------------------------------------------

describe("parseDate", () => {
  it("parses ISO format", () => {
    expect(parseDate("2024-03-15")).toBe("2024-03-15");
    expect(parseDate("2024-03-15T10:30:00Z")).toBe("2024-03-15");
  });

  it("parses dd.mm.yyyy", () => {
    expect(parseDate("15.03.2024")).toBe("2024-03-15");
    expect(parseDate("1.3.2024")).toBe("2024-03-01");
  });

  it("parses dd/mm/yyyy", () => {
    expect(parseDate("15/03/2024")).toBe("2024-03-15");
  });

  it("parses Date objects", () => {
    const d = new Date("2024-03-15T00:00:00Z");
    expect(parseDate(d)).toBe("2024-03-15");
  });

  it.each([undefined, null, ""])("returns undefined for %s", (input) => {
    expect(parseDate(input)).toBeUndefined();
  });

  it("returns undefined for non-date strings", () => {
    expect(parseDate("not a date")).toBeUndefined();
  });

  it("does not validate day/month ranges (known limitation)", () => {
    // parseDate matches the format but doesn't validate values
    expect(parseDate("32.13.2024")).toBe("2024-13-32");
  });
});

// ---------------------------------------------------------------------------
// resolveHotelIds
// ---------------------------------------------------------------------------

describe("resolveHotelIds", () => {
  const hotels = [
    { id: "1", nom: "Grand Hotel" },
    { id: "2", nom: "Petit Chalet" },
  ];

  it("resolves matching hotels case-insensitively", () => {
    const result = resolveHotelIds(["grand hotel", "PETIT CHALET"], hotels);
    expect(result.found).toHaveLength(2);
    expect(result.notFound).toHaveLength(0);
  });

  it("reports not found hotels", () => {
    const result = resolveHotelIds(["Grand Hotel", "Unknown"], hotels);
    expect(result.found).toHaveLength(1);
    expect(result.notFound).toEqual(["Unknown"]);
  });

  it("handles empty input", () => {
    const result = resolveHotelIds([], hotels);
    expect(result.found).toHaveLength(0);
    expect(result.notFound).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// parseRow
// ---------------------------------------------------------------------------

describe("parseRow", () => {
  it("returns null when Société is missing", () => {
    expect(parseRow({})).toBeNull();
    expect(parseRow({ "Société": "" })).toBeNull();
  });

  it("parses a minimal row", () => {
    const result = parseRow({ "Société": "Acme Corp" });
    expect(result).not.toBeNull();
    expect(result!.societeContact).toBe("Acme Corp");
    expect(result!.statut).toBe("Brouillon");
  });

  it("parses date options with pipe separator", () => {
    const result = parseRow({
      "Société": "Test",
      "Date option du": "01.03.2024 | 15.03.2024",
      "Date option au": "05.03.2024 | 20.03.2024",
    });
    expect(result!.dateOptions).toHaveLength(2);
    expect(result!.dateOptions![0]).toEqual({ du: "2024-03-01", au: "2024-03-05" });
    expect(result!.dateOptions![1]).toEqual({ du: "2024-03-15", au: "2024-03-20" });
  });

  it("parses booleans", () => {
    const result = parseRow({ "Société": "Test", "Séminaire journée": "oui", "Activité uniquement": "non" });
    expect(result!.seminaireJournee).toBe(true);
    expect(result!.activiteUniquement).toBe(false);
  });

  it("parses multi-value categorieHotel", () => {
    const result = parseRow({ "Société": "Test", "Catégorie hôtel": " 3* , 4* " });
    expect(result!.categorieHotel).toBe("3*,4*");
  });
});

// ---------------------------------------------------------------------------
// validateRow
// ---------------------------------------------------------------------------

describe("validateRow", () => {
  const allowed = {
    typeSociete: ["Entreprise", "Association"],
    statut: ["Brouillon", "Envoyé"],
    categorieHotel: ["3*", "4*", "5*"],
  };

  it("returns no errors for valid values", () => {
    const errors = validateRow({ "Type de société": "Entreprise", "Statut": "Brouillon" }, allowed);
    expect(errors).toHaveLength(0);
  });

  it("returns error for invalid value", () => {
    const errors = validateRow({ "Type de société": "Inconnu" }, allowed);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("Type de société");
    expect(errors[0].value).toBe("Inconnu");
  });

  it("validates multi-value fields individually", () => {
    const errors = validateRow({ "Catégorie hôtel": "3*, 6*" }, allowed);
    expect(errors).toHaveLength(1);
    expect(errors[0].value).toBe("6*");
  });

  it("skips empty values", () => {
    const errors = validateRow({ "Type de société": "" }, allowed);
    expect(errors).toHaveLength(0);
  });

  it("skips fields with no allowed list", () => {
    const errors = validateRow({ "Pays": "France" }, allowed);
    expect(errors).toHaveLength(0);
  });
});
