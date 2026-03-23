import JSZip from "jszip";

const SECT_PR_REGEX = /<w:sectPr\b[^>]*\/>|<w:sectPr\b[\s\S]*?<\/w:sectPr>/g;

/**
 * Merge multiple DOCX buffers into one, preserving images, styles, and formatting.
 * Uses the first document as the master (keeps its styles/theme/headers).
 * Appends body content of subsequent documents with page breaks.
 */
export async function mergeDocx(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) throw new Error("No documents to merge.");
  if (buffers.length === 1) return buffers[0];

  const masterZip = await JSZip.loadAsync(buffers[0]);

  // Parse master relationships
  const masterRelsXml =
    (await masterZip.file("word/_rels/document.xml.rels")?.async("string")) ??
    "";
  const masterRels = parseRels(masterRelsXml);
  let nextRelId = getNextRelId(masterRels);

  // Parse master content types
  let contentTypesXml =
    (await masterZip.file("[Content_Types].xml")?.async("string")) ?? "";

  // Get master body
  const masterDocXml =
    (await masterZip.file("word/document.xml")?.async("string")) ?? "";
  let masterBody = extractBodyContent(masterDocXml);
  let masterWrapper = extractBodyWrapper(masterDocXml);

  // Collect media files already in master
  const existingMedia = new Set<string>();
  masterZip.folder("word/media")?.forEach((relativePath) => {
    existingMedia.add(relativePath);
  });

  for (let i = 1; i < buffers.length; i++) {
    const slaveZip = await JSZip.loadAsync(buffers[i]);

    // Parse slave document.xml
    const slaveDocXml =
      (await slaveZip.file("word/document.xml")?.async("string")) ?? "";
    let slaveBody = extractBodyContent(slaveDocXml);

    // Merge namespace declarations from slave root into master wrapper
    const slaveRoot = slaveDocXml.match(/<w:document[^>]*>/)?.[0] ?? "";
    for (const m of slaveRoot.matchAll(/xmlns:([a-z0-9]+)="([^"]+)"/g)) {
      const decl = `xmlns:${m[1]}="${m[2]}"`;
      if (!masterWrapper.before.includes(`xmlns:${m[1]}="`)) {
        masterWrapper = {
          before: masterWrapper.before.replace(/<w:document /, `<w:document ${decl} `),
          after: masterWrapper.after,
        };
      }
    }

    // Parse slave relationships
    const slaveRelsXml =
      (await slaveZip.file("word/_rels/document.xml.rels")?.async("string")) ??
      "";
    const slaveRels = parseRels(slaveRelsXml);

    // Map of old relationship IDs to new ones
    const relIdMap = new Map<string, string>();

    // Copy media, headers/footers, and hyperlinks from slave
    for (const rel of slaveRels) {
      if (rel.type.includes("/image") || rel.type.includes("/media")) {
        const oldTarget = rel.target;
        const mediaFile = slaveZip.file(`word/${oldTarget}`);
        if (mediaFile) {
          const ext = oldTarget.split(".").pop() ?? "png";
          const newFileName = `media/merged_${i}_${nextRelId}.${ext}`;
          const content = await mediaFile.async("uint8array");
          masterZip.file(`word/${newFileName}`, content);

          const contentTypeEntry = `Extension="${ext}"`;
          if (!contentTypesXml.includes(contentTypeEntry)) {
            const mimeMap: Record<string, string> = {
              png: "image/png",
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              gif: "image/gif",
              bmp: "image/bmp",
              tiff: "image/tiff",
              svg: "image/svg+xml",
              emf: "image/x-emf",
              wmf: "image/x-wmf",
            };
            const mime = mimeMap[ext.toLowerCase()] ?? "application/octet-stream";
            contentTypesXml = contentTypesXml.replace(
              "</Types>",
              `<Default Extension="${ext}" ContentType="${mime}"/></Types>`
            );
          }

          const newRelId = `rId${nextRelId++}`;
          relIdMap.set(rel.id, newRelId);
          masterRels.push({ id: newRelId, type: rel.type, target: newFileName });
        }
      } else if (rel.type.includes("/hyperlink")) {
        // Add hyperlink relationships (external targets)
        const newRelId = `rId${nextRelId++}`;
        relIdMap.set(rel.id, newRelId);
        masterRels.push({ id: newRelId, type: rel.type, target: rel.target, external: true });
      }
    }

    // Remap relationship IDs in slave body (single-pass to avoid aliasing:
    // e.g. rId14→rId67 then rId67→rId71 would corrupt the first replacement)
    if (relIdMap.size > 0) {
      const idPattern = new RegExp(
        `(r:embed="|r:link="|r:id="|Id=")(${[...relIdMap.keys()].map(escapeRegex).join("|")})"`,
        "g"
      );
      slaveBody = slaveBody.replace(idPattern, (_, prefix, oldId) => {
        return `${prefix}${relIdMap.get(oldId) ?? oldId}"`;
      });
    }

    // Strip footnote/endnote references from slave body
    // (avoids ID conflicts and corrupt footnotes.xml in merged output)
    slaveBody = slaveBody.replace(/<w:footnoteReference\s[^/]*\/>/g, "");
    slaveBody = slaveBody.replace(/<w:endnoteReference\s[^/]*\/>/g, "");

    // Keep inline sectPr (they define section layout: columns, margins, etc.)
    // but strip header/footer references inside them (those parts aren't copied).
    // Handle both full (<w:sectPr ...>...</w:sectPr>) and self-closing (<w:sectPr ... />) forms.
    slaveBody = slaveBody.replace(
      SECT_PR_REGEX,
      (match) => {
        let cleaned = match;
        cleaned = cleaned.replace(/<w:headerReference\s[^/]*\/>/g, "");
        cleaned = cleaned.replace(/<w:footerReference\s[^/]*\/>/g, "");
        cleaned = cleaned.replace(/<w:titlePg\/>/g, "");
        return cleaned;
      }
    );

    // Add page break before slave content
    const pageBreak =
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

    masterBody += pageBreak + slaveBody;
  }

  // Rebuild master document.xml
  const newDocXml = masterWrapper.before + masterBody + masterWrapper.after;
  masterZip.file("word/document.xml", newDocXml);

  // Rebuild relationships
  masterZip.file(
    "word/_rels/document.xml.rels",
    buildRelsXml(masterRels)
  );

  // Update content types
  masterZip.file("[Content_Types].xml", contentTypesXml);

  const result = await masterZip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return Buffer.from(result);
}

// --- Helpers ---

type Rel = { id: string; type: string; target: string; external?: boolean };

function parseRels(xml: string): Rel[] {
  const rels: Rel[] = [];
  const regex =
    /<Relationship\s+[^>]*?Id="([^"]+)"[^>]*?Type="([^"]+)"[^>]*?Target="([^"]+)"[^/]*\/?>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    if (!rels.find((r) => r.id === match![1])) {
      const external = match[0].includes('TargetMode="External"');
      rels.push({ id: match[1], type: match[2], target: match[3], external });
    }
  }
  return rels;
}

function getNextRelId(rels: Rel[]): number {
  let max = 0;
  for (const rel of rels) {
    const num = parseInt(rel.id.replace(/\D/g, ""), 10);
    if (num > max) max = num;
  }
  return max + 1;
}

function extractBodyContent(docXml: string): string {
  // Extract everything between <w:body> and </w:body>, excluding the final sectPr
  const bodyMatch = docXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/);
  if (!bodyMatch) return "";
  let body = bodyMatch[1];

  const trailingSectPr = findTrailingSectPr(body);
  if (trailingSectPr) {
    body = body.substring(0, trailingSectPr.start);
  }

  return body;
}

function extractBodyWrapper(docXml: string): {
  before: string;
  after: string;
} {
  const bodyStart = docXml.indexOf("<w:body");
  const bodyTagEnd = docXml.indexOf(">", bodyStart) + 1;
  const bodyClose = docXml.lastIndexOf("</w:body>");

  const before = docXml.substring(0, bodyTagEnd);

  // Keep the final sectPr from master
  const bodyContent = docXml.substring(bodyTagEnd, bodyClose);
  const trailingSectPr = findTrailingSectPr(bodyContent);
  const sectPr = trailingSectPr
    ? bodyContent.substring(trailingSectPr.start, trailingSectPr.end)
    : "";

  const after = sectPr + "</w:body>" + docXml.substring(bodyClose + "</w:body>".length);

  return { before, after };
}

function findTrailingSectPr(body: string): { start: number; end: number } | null {
  // The body-level sectPr is always the last direct child of <w:body>.
  // Inline sectPr inside <w:pPr> can appear near the end of the document, so
  // we only accept the last <w:sectPr...> if nothing but whitespace follows it.
  const lastSectPrIdx = body.lastIndexOf("<w:sectPr");
  if (lastSectPrIdx < 0) return null;

  const openTagEnd = body.indexOf(">", lastSectPrIdx);
  if (openTagEnd < 0) return null;

  const openTag = body.substring(lastSectPrIdx, openTagEnd + 1);
  let end = -1;

  if (openTag.endsWith("/>")) {
    end = openTagEnd + 1;
  } else {
    const closeTag = "</w:sectPr>";
    const closeIdx = body.indexOf(closeTag, lastSectPrIdx);
    if (closeIdx < 0) return null;
    end = closeIdx + closeTag.length;
  }

  if (!/^\s*$/.test(body.substring(end))) {
    return null;
  }

  return { start: lastSectPrIdx, end };
}

function buildRelsXml(rels: Rel[]): string {
  const entries = rels
    .map(
      (r) =>
        r.external
          ? `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}" TargetMode="External"/>`
          : `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`
    )
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${entries}
</Relationships>`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace a placeholder that Word has split across multiple <w:t> runs.
 * Scans all <w:t> nodes, finds sequences whose concatenated text contains
 * the placeholder, then replaces the matched XML span with the replacement
 * text inside the first run (keeping its formatting).
 */
function replaceCrossRun(xml: string, placeholder: string, replacement: string): string {
  // Find all <w:t ...>text</w:t> with their positions
  const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  const nodes: { start: number; end: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = tRegex.exec(xml)) !== null) {
    nodes.push({ start: m.index, end: m.index + m[0].length, text: m[1] });
  }

  // Build paragraph boundaries so we never match across <w:p> elements
  const pBoundaries: number[] = [];
  const pRegex = /<\/w:p>/g;
  while ((m = pRegex.exec(xml)) !== null) {
    pBoundaries.push(m.index);
  }
  // Check if two positions are in the same paragraph
  const sameParaBlock = (posA: number, posB: number): boolean => {
    // They are in the same paragraph if no </w:p> appears between them
    for (const boundary of pBoundaries) {
      if (boundary > posA && boundary < posB) return false;
      if (boundary >= posB) break;
    }
    return true;
  };

  // Sliding window: concatenate consecutive <w:t> texts and look for the placeholder
  // Only within the same paragraph to avoid destroying paragraph structure
  for (let i = 0; i < nodes.length; i++) {
    let concat = "";
    for (let j = i; j < nodes.length; j++) {
      // Stop if we crossed a paragraph boundary
      if (j > i && !sameParaBlock(nodes[i].start, nodes[j].start)) break;
      concat += nodes[j].text;
      const idx = concat.indexOf(placeholder);
      if (idx >= 0) {
        // Found! Determine which nodes are involved
        // Characters before the placeholder in the first node
        const prefix = concat.substring(0, idx);
        // Characters after the placeholder in the last node
        const suffix = concat.substring(idx + placeholder.length);

        // Get the XML range to replace: from start of first matched node to end of last
        const xmlStart = nodes[i].start;
        const xmlEnd = nodes[j].end;

        // Grab the opening <w:t> tag from the first node to preserve xml:space etc.
        const firstTag = xml.substring(xmlStart).match(/<w:t(?:\s[^>]*)?>/)?.[0] ?? '<w:t xml:space="preserve">';

        // Build replacement: keep prefix and suffix in <w:t> nodes
        const newXml = `${firstTag}${prefix}${replacement}${suffix}</w:t>`;

        // Remove the intermediate runs between first and last node
        // But we need to be careful: we can only safely remove content between
        // the first <w:t>'s parent </w:t> and the last <w:t>'s </w:t>
        xml = xml.substring(0, xmlStart) + newXml + xml.substring(xmlEnd);

        // Remove now-empty <w:r> elements left behind (runs whose <w:t> was consumed)
        // An empty run looks like: <w:r>...<w:rPr>...</w:rPr></w:r> (no <w:t>)
        xml = xml.replace(/<w:r\b[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<\/w:r>/g, (match) => {
          return match.includes("<w:t") ? match : "";
        });

        // Recurse to handle multiple occurrences
        return replaceCrossRun(xml, placeholder, replacement);
      }
      if (concat.length > placeholder.length * 3) break; // too far apart
    }
  }
  return xml;
}

// ---------------------------------------------------------------------------
// Offer-text placeholder replacement
// ---------------------------------------------------------------------------

/**
 * Replace `{{OFFER_TEXT}}` inside a DOCX buffer with the given plain text.
 * Line breaks in the text become `<w:br/>` elements.
 * Handles the case where Word splits the placeholder across multiple XML runs.
 */
export async function replaceOfferText(
  buffer: Buffer,
  offerText: string
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  let docXml =
    (await zip.file("word/document.xml")?.async("string")) ?? "";

  const placeholder = "{{OFFER_TEXT}}";

  // Check if the placeholder exists at all (strip XML tags to find it)
  const textOnly = docXml.replace(/<[^>]*>/g, "");
  if (!textOnly.includes(placeholder)) {
    // No placeholder anywhere in the document — return unchanged
    return buffer;
  }

  // Normalize line endings and strip control characters
  const cleanText = offerText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  // Escape for XML
  const escaped = cleanText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Build replacement: line breaks become <w:br/> (sibling of <w:t> inside <w:r>)
  const replacement = escaped
    .split("\n")
    .join('</w:t><w:br/><w:t xml:space="preserve">');

  if (docXml.includes(placeholder)) {
    // Simple case: placeholder is in a single <w:t> run
    docXml = docXml.replace(placeholder, replacement);
  } else {
    docXml = replaceCrossRun(docXml, placeholder, replacement);
  }

  zip.file("word/document.xml", docXml);

  const result = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return Buffer.from(result);
}

// ---------------------------------------------------------------------------
// Generic placeholder replacement (cover page fields, etc.)
// ---------------------------------------------------------------------------

/**
 * Replace `{{KEY}}` placeholders inside a DOCX buffer with plain-text values.
 * Handles Word splitting placeholders across multiple XML runs.
 * Values are escaped for XML; line breaks become `<w:br/>`.
 */
export async function replacePlaceholders(
  buffer: Buffer,
  replacements: Record<string, string>
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  let docXml =
    (await zip.file("word/document.xml")?.async("string")) ?? "";

  const textOnly = docXml.replace(/<[^>]*>/g, "");

  for (const [key, rawValue] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    if (!textOnly.includes(placeholder)) continue;

    const clean = rawValue
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

    const escaped = clean
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const replacement = escaped
      .split("\n")
      .join('</w:t><w:br/><w:t xml:space="preserve">');

    if (docXml.includes(placeholder)) {
      docXml = docXml.replaceAll(placeholder, replacement);
    } else {
      docXml = replaceCrossRun(docXml, placeholder, replacement);
    }
  }

  zip.file("word/document.xml", docXml);

  const resultBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return Buffer.from(resultBuf);
}
