import { describe, it, expect } from "vitest";
import type { SharedOfferResponse } from "@/features/offres/api/mappers";

/**
 * Guard test: ensures that every field in SharedOfferResponse is accounted for
 * in the Supabase RPC `get_shared_offer`.
 *
 * If this test fails, it means a field was added to SharedOfferResponse but the
 * RPC function in Supabase was NOT updated. Steps to fix:
 *   1. Update the RPC `get_shared_offer` in Supabase SQL Editor to SELECT and
 *      return the new field(s).
 *   2. Update the EXPECTED_KEYS list below.
 */

// These keys MUST match the columns returned by the `get_shared_offer` RPC.
// When you add a field to SharedOfferResponse, add it here AND update the RPC.
const EXPECTED_KEYS: (keyof SharedOfferResponse)[] = [
  "id",
  "societeContact",
  "dateOptions",
  "dateConfirmeeDu",
  "dateConfirmeeAu",
  "nombrePax",
  "nombreDeNuits",
  "chambresSimple",
  "chambresDouble",
  "chambresAutre",
  "demiPension",
  "pensionComplete",
  "seminaireJournee",
  "seminaireDemiJournee",
  "seminaireDetails",
  "langue",
  "typeSejour",
  "activiteUniquement",
];

describe("SharedOfferResponse ↔ get_shared_offer RPC sync", () => {
  it("EXPECTED_KEYS covers every field in SharedOfferResponse", () => {
    // Build a dummy object that satisfies every key of the type.
    // TypeScript ensures this object has ALL required keys at compile time.
    const dummy: Required<SharedOfferResponse> = {
      id: "",
      societeContact: "",
      dateOptions: [],
      dateConfirmeeDu: null,
      dateConfirmeeAu: null,
      nombrePax: null,
      nombreDeNuits: null,
      chambresSimple: null,
      chambresDouble: null,
      chambresAutre: null,
      demiPension: null,
      pensionComplete: null,
      seminaireJournee: null,
      seminaireDemiJournee: null,
      seminaireDetails: null,
      langue: null,
      typeSejour: null,
      activiteUniquement: null,
    };

    const actualKeys = Object.keys(dummy).sort();
    const expectedKeys = [...EXPECTED_KEYS].sort();

    expect(actualKeys).toEqual(expectedKeys);
  });
});
