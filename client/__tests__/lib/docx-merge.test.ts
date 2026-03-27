import { describe, it, expect } from "vitest";
import {
  parseRels,
  getNextRelId,
  extractBodyContent,
  findTrailingSectPr,
  replaceCrossRun,
} from "@/lib/docx-merge";

// ---------------------------------------------------------------------------
// parseRels
// ---------------------------------------------------------------------------

describe("parseRels", () => {
  it("parses relationship elements", () => {
    const xml = `
      <Relationship Id="rId1" Type="http://type1" Target="doc.xml"/>
      <Relationship Id="rId2" Type="http://type2" Target="styles.xml"/>
    `;
    const rels = parseRels(xml);
    expect(rels).toHaveLength(2);
    expect(rels[0]).toEqual({ id: "rId1", type: "http://type1", target: "doc.xml", external: false });
  });

  it("deduplicates by ID", () => {
    const xml = `
      <Relationship Id="rId1" Type="http://type1" Target="a.xml"/>
      <Relationship Id="rId1" Type="http://type1" Target="b.xml"/>
    `;
    const rels = parseRels(xml);
    expect(rels).toHaveLength(1);
    expect(rels[0].target).toBe("a.xml");
  });

  it("detects external relationships", () => {
    const xml = `<Relationship Id="rId1" Type="http://t" Target="http://example.com" TargetMode="External"/>`;
    const rels = parseRels(xml);
    expect(rels[0].external).toBe(true);
  });

  it("returns empty for no matches", () => {
    expect(parseRels("<root></root>")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getNextRelId
// ---------------------------------------------------------------------------

describe("getNextRelId", () => {
  it("returns max + 1", () => {
    const rels = [
      { id: "rId1", type: "", target: "", external: false },
      { id: "rId5", type: "", target: "", external: false },
      { id: "rId3", type: "", target: "", external: false },
    ];
    expect(getNextRelId(rels)).toBe(6);
  });

  it("returns 1 for empty", () => {
    expect(getNextRelId([])).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// extractBodyContent
// ---------------------------------------------------------------------------

describe("extractBodyContent", () => {
  it("extracts body without trailing sectPr", () => {
    const xml = `<w:body><w:p>content</w:p><w:sectPr><w:pgSz/></w:sectPr></w:body>`;
    expect(extractBodyContent(xml)).toBe("<w:p>content</w:p>");
  });

  it("extracts body without sectPr", () => {
    const xml = `<w:body><w:p>content</w:p></w:body>`;
    expect(extractBodyContent(xml)).toBe("<w:p>content</w:p>");
  });

  it("returns empty for missing body", () => {
    expect(extractBodyContent("<root/>")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// findTrailingSectPr
// ---------------------------------------------------------------------------

describe("findTrailingSectPr", () => {
  it("finds trailing sectPr with closing tag", () => {
    const body = `<w:p>text</w:p><w:sectPr><w:pgSz/></w:sectPr>`;
    const result = findTrailingSectPr(body);
    expect(result).not.toBeNull();
    expect(body.substring(result!.start, result!.end)).toBe("<w:sectPr><w:pgSz/></w:sectPr>");
  });

  it("finds self-closing sectPr", () => {
    const body = `<w:p>text</w:p><w:sectPr/>`;
    const result = findTrailingSectPr(body);
    expect(result).not.toBeNull();
  });

  it("returns null when sectPr is not trailing", () => {
    const body = `<w:sectPr/><w:p>text after</w:p>`;
    expect(findTrailingSectPr(body)).toBeNull();
  });

  it("returns null when no sectPr", () => {
    expect(findTrailingSectPr("<w:p>text</w:p>")).toBeNull();
  });

  it("allows trailing whitespace after sectPr", () => {
    const body = `<w:p>text</w:p><w:sectPr/>  \n  `;
    expect(findTrailingSectPr(body)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// replaceCrossRun
// ---------------------------------------------------------------------------

describe("replaceCrossRun", () => {
  it("replaces placeholder in a single run", () => {
    const xml = `<w:p><w:r><w:t>Hello {{NAME}}</w:t></w:r></w:p>`;
    const result = replaceCrossRun(xml, "{{NAME}}", "World");
    expect(result).toContain("Hello World");
    expect(result).not.toContain("{{NAME}}");
  });

  it("replaces placeholder split across two runs", () => {
    const xml = `<w:p><w:r><w:t>{{NA</w:t></w:r><w:r><w:t>ME}}</w:t></w:r></w:p>`;
    const result = replaceCrossRun(xml, "{{NAME}}", "World");
    expect(result).toContain("World");
    expect(result).not.toContain("{{NA");
  });

  it("replaces placeholder split across three runs", () => {
    const xml = `<w:p><w:r><w:t>{{</w:t></w:r><w:r><w:t>NA</w:t></w:r><w:r><w:t>ME}}</w:t></w:r></w:p>`;
    const result = replaceCrossRun(xml, "{{NAME}}", "World");
    expect(result).toContain("World");
  });

  it("does not match across paragraphs", () => {
    const xml = `<w:p><w:r><w:t>{{NA</w:t></w:r></w:p><w:p><w:r><w:t>ME}}</w:t></w:r></w:p>`;
    const result = replaceCrossRun(xml, "{{NAME}}", "World");
    // Should NOT replace since split across paragraphs
    expect(result).toContain("{{NA");
  });

  it("returns xml unchanged when placeholder not found", () => {
    const xml = `<w:p><w:r><w:t>Hello</w:t></w:r></w:p>`;
    expect(replaceCrossRun(xml, "{{NAME}}", "World")).toBe(xml);
  });
});
