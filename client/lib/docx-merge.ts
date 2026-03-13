import JSZip from "jszip";

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
  const masterWrapper = extractBodyWrapper(masterDocXml);

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

    // Parse slave relationships
    const slaveRelsXml =
      (await slaveZip.file("word/_rels/document.xml.rels")?.async("string")) ??
      "";
    const slaveRels = parseRels(slaveRelsXml);

    // Map of old relationship IDs to new ones
    const relIdMap = new Map<string, string>();

    // Copy media and remap relationships
    for (const rel of slaveRels) {
      if (rel.type.includes("/image") || rel.type.includes("/media")) {
        const oldTarget = rel.target; // e.g. "media/image1.png"
        const mediaFile = slaveZip.file(`word/${oldTarget}`);
        if (mediaFile) {
          // Generate unique filename
          const ext = oldTarget.split(".").pop() ?? "png";
          const newFileName = `media/merged_${i}_${nextRelId}.${ext}`;

          // Copy media file to master
          const content = await mediaFile.async("uint8array");
          masterZip.file(`word/${newFileName}`, content);

          // Add content type if not present
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

          // Create new relationship
          const newRelId = `rId${nextRelId++}`;
          relIdMap.set(rel.id, newRelId);
          masterRels.push({
            id: newRelId,
            type: rel.type,
            target: newFileName,
          });
        }
      }
    }

    // Remap relationship IDs in slave body
    for (const [oldId, newId] of relIdMap) {
      // Replace r:embed="rIdX" and r:link="rIdX" and r:id="rIdX"
      const pattern = new RegExp(
        `(r:embed="|r:link="|r:id="|Id=")${escapeRegex(oldId)}"`,
        "g"
      );
      slaveBody = slaveBody.replace(pattern, `$1${newId}"`);
    }

    // ---- Merge footnotes & endnotes ----
    for (const noteType of ["footnotes", "endnotes"] as const) {
      const tagName = noteType === "footnotes" ? "footnote" : "endnote";
      const refTagName =
        noteType === "footnotes" ? "footnoteReference" : "endnoteReference";
      const relTypeUrl =
        noteType === "footnotes"
          ? "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes"
          : "http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes";
      const partContentType =
        noteType === "footnotes"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml";

      const slaveNotesXml = await slaveZip
        .file(`word/${noteType}.xml`)
        ?.async("string");
      if (!slaveNotesXml) continue;

      // Extract content notes from slave (ID > 0)
      const noteRegex = new RegExp(
        `<w:${tagName}\\s[^>]*?w:id="(\\d+)"[^>]*?>[\\s\\S]*?<\\/w:${tagName}>`,
        "g"
      );
      const slaveNotes: { id: number; xml: string }[] = [];
      let noteMatch;
      while ((noteMatch = noteRegex.exec(slaveNotesXml)) !== null) {
        const id = parseInt(noteMatch[1], 10);
        if (id > 0) {
          slaveNotes.push({ id, xml: noteMatch[0] });
        }
      }
      if (slaveNotes.length === 0) continue;

      // Ensure master has the notes file
      let masterNotesXml = await masterZip
        .file(`word/${noteType}.xml`)
        ?.async("string");
      if (!masterNotesXml) {
        // Copy root tag (with namespaces) and separator notes from slave
        const rootMatch = slaveNotesXml.match(
          new RegExp(`<w:${noteType}[\\s\\S]*?>`)
        );
        const rootTag = rootMatch ? rootMatch[0] : `<w:${noteType}>`;

        // Extract separator notes (id <= 0)
        const sepRegex = new RegExp(
          `<w:${tagName}\\s[^>]*?w:id="(-?\\d+)"[^>]*?>[\\s\\S]*?<\\/w:${tagName}>`,
          "g"
        );
        let sepNotes = "";
        let sepMatch;
        while ((sepMatch = sepRegex.exec(slaveNotesXml)) !== null) {
          const sepId = parseInt(sepMatch[1], 10);
          if (sepId <= 0) sepNotes += sepMatch[0] + "\n";
        }

        masterNotesXml =
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
          `${rootTag}\n${sepNotes}</w:${noteType}>`;

        // Add relationship to master
        const relId = `rId${nextRelId++}`;
        masterRels.push({
          id: relId,
          type: relTypeUrl,
          target: `${noteType}.xml`,
        });

        // Add content type override
        if (!contentTypesXml.includes(`PartName="/word/${noteType}.xml"`)) {
          contentTypesXml = contentTypesXml.replace(
            "</Types>",
            `<Override PartName="/word/${noteType}.xml" ContentType="${partContentType}"/></Types>`
          );
        }
      }

      // Find max note ID in master
      let maxNoteId = 0;
      for (const m of masterNotesXml.matchAll(/w:id="(-?\d+)"/g)) {
        const nid = parseInt(m[1], 10);
        if (nid > maxNoteId) maxNoteId = nid;
      }

      // Remap slave note IDs to avoid conflicts
      const noteIdMap = new Map<number, number>();
      for (const note of slaveNotes) {
        noteIdMap.set(note.id, ++maxNoteId);
      }

      // Update footnoteReference / endnoteReference in slave body
      for (const [oldNoteId, newNoteId] of noteIdMap) {
        slaveBody = slaveBody.replace(
          new RegExp(
            `(<w:${refTagName}\\s[^>]*?w:id=")${oldNoteId}(")`,
            "g"
          ),
          `$1${newNoteId}$2`
        );
      }

      // Build remapped notes XML
      let newNotesXml = "";
      for (const note of slaveNotes) {
        const newNoteId = noteIdMap.get(note.id)!;
        newNotesXml +=
          note.xml.replace(/w:id="\d+"/, `w:id="${newNoteId}"`) + "\n";
      }

      // Insert before closing tag
      masterNotesXml = masterNotesXml.replace(
        new RegExp(`</w:${noteType}>`),
        newNotesXml + `</w:${noteType}>`
      );

      masterZip.file(`word/${noteType}.xml`, masterNotesXml);
    }

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

type Rel = { id: string; type: string; target: string };

function parseRels(xml: string): Rel[] {
  const rels: Rel[] = [];
  const regex =
    /<Relationship\s+Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"[^/]*\/>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    rels.push({ id: match[1], type: match[2], target: match[3] });
  }
  // Also handle different attribute order
  const regex2 =
    /<Relationship\s+[^>]*?Id="([^"]+)"[^>]*?Type="([^"]+)"[^>]*?Target="([^"]+)"[^/]*\/>/g;
  while ((match = regex2.exec(xml)) !== null) {
    if (!rels.find((r) => r.id === match![1])) {
      rels.push({ id: match[1], type: match[2], target: match[3] });
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

  // Remove the final section properties (keep them only in master)
  body = body.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>\s*$/, "");
  // Also handle self-closing sectPr
  body = body.replace(/<w:sectPr[^/]*\/>\s*$/, "");

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
  const sectPrMatch = bodyContent.match(/<w:sectPr[\s\S]*?<\/w:sectPr>\s*$/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : "";

  const after = sectPr + "</w:body>" + docXml.substring(bodyClose + "</w:body>".length);

  return { before, after };
}

function buildRelsXml(rels: Rel[]): string {
  const entries = rels
    .map(
      (r) =>
        `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`
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
    // Word split the placeholder across multiple runs.
    // Allow run-boundary XML tags between each character:
    //   </w:t> </w:r> <w:r> <w:rPr>…</w:rPr> <w:t …>
    // Also allow <w:proofErr …/> elements that Word inserts for spell-check.
    const runBoundary =
      "(?:" +
        "\\s*</w:t>\\s*" +
        "(?:</w:r>\\s*" +
          "(?:<w:proofErr[^/]*/?>\\s*)*" +
          "<w:r>\\s*(?:<w:rPr>[\\s\\S]*?</w:rPr>\\s*)?" +
        ")?" +
        "<w:t[^>]*>\\s*" +
      ")?";
    const pattern = placeholder
      .split("")
      .map((c) => escapeRegex(c))
      .join(runBoundary);
    docXml = docXml.replace(new RegExp(pattern), replacement);
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
      const runBoundary =
        "(?:" +
          "\\s*</w:t>\\s*" +
          "(?:</w:r>\\s*" +
            "(?:<w:proofErr[^/]*/?>\\s*)*" +
            "<w:r>\\s*(?:<w:rPr>[\\s\\S]*?</w:rPr>\\s*)?" +
          ")?" +
          "<w:t[^>]*>\\s*" +
        ")?";
      const pattern = placeholder
        .split("")
        .map((c) => escapeRegex(c))
        .join(runBoundary);
      docXml = docXml.replace(new RegExp(pattern, "g"), replacement);
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
