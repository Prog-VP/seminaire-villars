import { describe, expect, it } from "vitest";
import {
  formatOfferPptDestinationFilename,
  formatOfferPptDestinationLabel,
  resolveOfferPptDestinations,
} from "@/features/documents/offer-ppt-destinations";

describe("resolveOfferPptDestinations", () => {
  it("uses included hotel destinations in auto mode before the offer destination", () => {
    expect(
      resolveOfferPptDestinations({
        mode: "auto",
        offerDestination: "Villars",
        hotelDestinations: ["Les Diablerets"],
      })
    ).toEqual(["DIABLERETS"]);
  });

  it("falls back to the offer destination when auto mode has no hotel destination", () => {
    expect(
      resolveOfferPptDestinations({
        mode: "auto",
        offerDestination: "Villars",
        hotelDestinations: [],
      })
    ).toEqual(["VILLARS"]);
  });

  it("keeps both destinations when included hotels cover both stations", () => {
    expect(
      resolveOfferPptDestinations({
        mode: "auto",
        offerDestination: "Villars",
        hotelDestinations: ["Les Diablerets", "Villars"],
      })
    ).toEqual(["VILLARS", "DIABLERETS"]);
  });

  it("allows a manual generation destination override", () => {
    expect(
      resolveOfferPptDestinations({
        mode: "villars",
        offerDestination: "Les Diablerets",
        hotelDestinations: ["Les Diablerets"],
      })
    ).toEqual(["VILLARS"]);
  });
});

describe("offer PPT destination formatting", () => {
  it("formats labels and filenames for both destinations", () => {
    const destinations = ["VILLARS", "DIABLERETS"] as const;

    expect(formatOfferPptDestinationLabel([...destinations])).toBe("Villars, Les Diablerets");
    expect(formatOfferPptDestinationFilename([...destinations])).toBe("Villars_Les_Diablerets");
  });
});
