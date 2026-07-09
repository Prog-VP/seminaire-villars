import { describe, expect, it } from "vitest";
import { formatEurChfRateForStorage, parseEcbEurChfRate } from "@/lib/exchange-rate";

describe("parseEcbEurChfRate", () => {
  it("extracts the CHF rate and source date from the ECB XML feed", () => {
    const xml = `
      <gesmes:Envelope>
        <Cube>
          <Cube time="2026-07-07">
            <Cube currency="USD" rate="1.1433"/>
            <Cube currency="CHF" rate="0.9218"/>
          </Cube>
        </Cube>
      </gesmes:Envelope>
    `;

    expect(parseEcbEurChfRate(xml)).toEqual({
      rate: 0.9218,
      source: "ECB",
      sourceDate: "2026-07-07",
      sourceUrl: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
    });
  });

  it("throws when the CHF rate is missing", () => {
    expect(() => parseEcbEurChfRate("<Cube><Cube time=\"2026-07-07\" /></Cube>")).toThrow(
      "Cours EUR/CHF introuvable",
    );
  });
});

describe("formatEurChfRateForStorage", () => {
  it("keeps meaningful decimals without trailing zeroes", () => {
    expect(formatEurChfRateForStorage(0.92)).toBe("0.92");
    expect(formatEurChfRateForStorage(0.9218)).toBe("0.9218");
  });
});
