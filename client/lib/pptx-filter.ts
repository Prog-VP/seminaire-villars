import JSZip from "jszip";

export type OfferPptxFilter = {
  lang: string;
  destinations: string[];
  seasons: string[];
  hotelTags: string[];
};

export type PptxPlaceholderMap = Record<string, string>;
export type PptxHotelPlaceholderMap = Record<string, PptxPlaceholderMap>;

export type FilterPptxResult = {
  buffer: Buffer;
  keptSlides: number;
  removedSlides: number;
};

type Relationship = {
  id: string;
  target: string;
  type: string;
  raw: string;
};

type SlideEntry = {
  rId: string;
  slideId: string;
  slidePath: string;
  slideRelPath: string;
  notesPath: string | null;
  rawSlideId: string;
  tags: Map<string, string[]>;
};

const PRESENTATION_PATH = "ppt/presentation.xml";
const PRESENTATION_RELS_PATH = "ppt/_rels/presentation.xml.rels";

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function encodeXmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseRelationships(xml: string): Relationship[] {
  return [...xml.matchAll(/<Relationship\b([^>]*?)\/>/g)].map((match) => {
    const attrs = match[1];
    return {
      id: attrs.match(/\bId="([^"]+)"/)?.[1] ?? "",
      target: attrs.match(/\bTarget="([^"]+)"/)?.[1] ?? "",
      type: attrs.match(/\bType="([^"]+)"/)?.[1] ?? "",
      raw: match[0],
    };
  });
}

function normalizePath(baseDir: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);

  const parts = `${baseDir}/${target}`.split("/");
  const normalized: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") normalized.pop();
    else normalized.push(part);
  }
  return normalized.join("/");
}

function relsPathForPart(partPath: string) {
  const slash = partPath.lastIndexOf("/");
  const dir = partPath.slice(0, slash);
  const file = partPath.slice(slash + 1);
  return `${dir}/_rels/${file}.rels`;
}

function partName(path: string) {
  return `/${path}`;
}

function extractText(xml: string) {
  const texts = [...xml.matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)].map((match) =>
    decodeXmlText(match[1])
  );
  return texts.join("\n");
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parseTags(text: string) {
  const tags = new Map<string, string[]>();
  const block = text.match(/#TAGS([\s\S]*?)#END/i);
  if (!block) return tags;

  for (const rawLine of block[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || !line.includes(":")) continue;
    const [rawKey, ...rawValue] = line.split(":");
    const key = normalizeToken(rawKey);
    const values = rawValue
      .join(":")
      .split(/[,\s]+/)
      .map(normalizeToken)
      .filter(Boolean);
    if (key && values.length > 0) tags.set(key, values);
  }
  return tags;
}

function tagMatches(tags: Map<string, string[]>, key: string, accepted: string[]) {
  const values = tags.get(key);
  if (!values || values.length === 0) return true;
  return values.includes("ALL") || values.some((value) => accepted.includes(value));
}

function shouldKeepSlide(tags: Map<string, string[]>, filter: OfferPptxFilter) {
  if (tags.size === 0) return false;

  const lang = normalizeToken(filter.lang);
  const destinations = filter.destinations.map(normalizeToken).filter(Boolean);
  const seasons = filter.seasons.map(normalizeToken).filter(Boolean);
  const hotelTags = filter.hotelTags.map(normalizeToken).filter(Boolean);
  const slideHotelTags = tags.get("HOTEL");

  if (!tagMatches(tags, "LANG", [lang])) return false;
  if (!tagMatches(tags, "DEST", destinations.length ? destinations : ["ALL"])) return false;
  if (!tagMatches(tags, "SEASON", seasons.length ? seasons : ["ALL"])) return false;

  if (slideHotelTags?.length) {
    return slideHotelTags.some((tag) => hotelTags.includes(tag));
  }

  return true;
}

function firstSlideNumber(
  slides: SlideEntry[],
  predicate: (tags: Map<string, string[]>) => boolean
) {
  const index = slides.findIndex((slide) => predicate(slide.tags));
  return index >= 0 ? String(index + 1) : "";
}

function tagsInclude(tags: Map<string, string[]>, key: string, value: string) {
  return tags.get(key)?.includes(normalizeToken(value)) ?? false;
}

function buildPagePlaceholders(slides: SlideEntry[]): PptxPlaceholderMap {
  const section = (name: string) =>
    firstSlideNumber(slides, (tags) => tagsInclude(tags, "SECTION", name));
  const destination = (dest: string) =>
    firstSlideNumber(slides, (tags) => tagsInclude(tags, "DEST", dest));
  const destinationSection = (dest: string, sectionName: string) =>
    firstSlideNumber(
      slides,
      (tags) =>
        tagsInclude(tags, "DEST", dest) &&
        tagsInclude(tags, "SECTION", sectionName)
    );

  return {
    PAGE_MAP: section("MAP"),
    PAGE_SOMMAIRE: section("SOMMAIRE"),
    PAGE_CONTACT: section("CONTACT"),
    PAGE_CONTACTS: section("CONTACT"),
    PAGE_VILLARS: destination("VILLARS"),
    PAGE_VILLARS_HOTELS: destinationSection("VILLARS", "HOTELS"),
    PAGE_VILLARS_ACTIVITES: destinationSection("VILLARS", "ACTIVITES"),
    PAGE_DIABLERETS: destination("DIABLERETS"),
    PAGE_DIABLERETS_HOTELS: destinationSection("DIABLERETS", "HOTELS"),
    PAGE_DIABLERETS_ACTIVITES: destinationSection("DIABLERETS", "ACTIVITES"),
  };
}

function removeOverrides(contentTypesXml: string, paths: string[]) {
  let next = contentTypesXml;
  for (const path of paths) {
    const escaped = partName(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(
      new RegExp(`<Override\\b[^>]*PartName="${escaped}"[^>]*/>`, "g"),
      ""
    );
  }
  return next;
}

function removeSlideReferences(xml: string, slideIds: string[]) {
  let next = xml;
  for (const slideId of slideIds) {
    const escaped = slideId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next
      .replace(new RegExp(`<p14:sldId\\b[^>]*\\bid="${escaped}"[^>]*/>`, "g"), "")
      .replace(new RegExp(`<p:sld\\b[^>]*\\bid="${escaped}"[^>]*/>`, "g"), "");
  }

  next = next.replace(
    /<p:custShow\b([^>]*)>\s*<p:sldLst>\s*<\/p:sldLst>\s*<\/p:custShow>/g,
    ""
  );
  next = next.replace(/<p:custShowLst>\s*<\/p:custShowLst>/g, "");

  return next;
}

function replacePlaceholdersInSlideXml(
  xml: string,
  replacements: PptxPlaceholderMap
) {
  const replaceText = (value: string) =>
    value.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(replacements, key)
        ? replacements[key]
        : match
    );

  let nextXml = removeEmptyPageRows(xml, replacements);
  const paragraphs = nextXml.match(/<a:p\b[\s\S]*?<\/a:p>/g) ?? [];

  for (const paragraph of paragraphs) {
    const nextParagraph = replacePlaceholdersInTextRuns(paragraph, replaceText);

    if (nextParagraph === paragraph) continue;
    nextXml = nextXml.replace(paragraph, nextParagraph);
  }

  return nextXml;
}

function replacePlaceholdersInTextRuns(
  xml: string,
  replaceText: (value: string) => string
) {
  const textMatches = [...xml.matchAll(/<a:t\b([^>]*)>([\s\S]*?)<\/a:t>/g)];
  if (textMatches.length === 0) return xml;

  const runs = textMatches.map((match) => ({
    raw: match[0],
    attrs: match[1],
    text: decodeXmlText(match[2]),
    start: 0,
    end: 0,
  }));
  let cursor = 0;
  for (const run of runs) {
    run.start = cursor;
    cursor += run.text.length;
    run.end = cursor;
  }

  const combined = runs.map((run) => run.text).join("");
  const placeholders = [...combined.matchAll(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g)];
  if (placeholders.length === 0) return xml;

  for (const placeholder of placeholders.reverse()) {
    const match = placeholder[0];
    const start = placeholder.index ?? 0;
    const end = start + match.length;
    const replacement = replaceText(match);
    if (replacement === match) continue;

    const startRunIndex = runs.findIndex((run) => start >= run.start && start < run.end);
    const endRunIndex = runs.findIndex((run) => end > run.start && end <= run.end);
    if (startRunIndex < 0 || endRunIndex < 0) continue;

    const startRun = runs[startRunIndex];
    const endRun = runs[endRunIndex];
    const startOffset = start - startRun.start;
    const endOffset = end - endRun.start;

    if (startRunIndex === endRunIndex) {
      startRun.text =
        startRun.text.slice(0, startOffset) +
        replacement +
        startRun.text.slice(endOffset);
      continue;
    }

    startRun.text = startRun.text.slice(0, startOffset) + replacement;
    for (let index = startRunIndex + 1; index < endRunIndex; index += 1) {
      runs[index].text = "";
    }
    endRun.text = endRun.text.slice(endOffset);
  }

  let runIndex = 0;
  return xml.replace(/<a:t\b([^>]*)>[\s\S]*?<\/a:t>/g, () => {
    const run = runs[runIndex];
    runIndex += 1;
    return `<a:t${run.attrs}>${encodeXmlText(run.text)}</a:t>`;
  });
}

function removeEmptyPageRows(xml: string, replacements: PptxPlaceholderMap) {
  return xml.replace(/<a:tr\b[\s\S]*?<\/a:tr>/g, (row) => {
    const text = [...row.matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)]
      .map((match) => decodeXmlText(match[1]))
      .join("");
    const pageKeys = [...text.matchAll(/\{\{\s*(PAGE_[A-Z0-9_]+)\s*\}\}/g)].map(
      (match) => match[1]
    );

    if (pageKeys.some((key) => Object.prototype.hasOwnProperty.call(replacements, key) && !replacements[key])) {
      return "";
    }

    return row;
  });
}

export async function filterPptxSlides(
  input: Buffer,
  filter: OfferPptxFilter,
  replacements: PptxPlaceholderMap = {},
  hotelReplacements: PptxHotelPlaceholderMap = {}
): Promise<FilterPptxResult> {
  const zip = await JSZip.loadAsync(input);
  const presentationFile = zip.file(PRESENTATION_PATH);
  const presentationRelsFile = zip.file(PRESENTATION_RELS_PATH);

  if (!presentationFile || !presentationRelsFile) {
    throw new Error("PowerPoint MASTER invalide.");
  }

  const presentationXml = await presentationFile.async("string");
  const presentationRelsXml = await presentationRelsFile.async("string");
  const presentationRels = parseRelationships(presentationRelsXml);
  const relById = new Map(presentationRels.map((rel) => [rel.id, rel]));

  const slideEntries: SlideEntry[] = [];
  for (const match of presentationXml.matchAll(/<p:sldId\b[^>]*\bid="([^"]+)"[^>]*\br:id="([^"]+)"[^>]*\/>/g)) {
    const slideId = match[1];
    const rId = match[2];
    const rel = relById.get(rId);
    if (!rel || !rel.target.includes("slides/slide")) continue;

    const slidePath = normalizePath("ppt", rel.target);
    const slideRelPath = relsPathForPart(slidePath);
    const slideXml = (await zip.file(slidePath)?.async("string")) ?? "";
    const slideRelsXml = (await zip.file(slideRelPath)?.async("string")) ?? "";
    const slideRels = parseRelationships(slideRelsXml);
    const notesRel = slideRels.find((slideRel) => slideRel.type.includes("/notesSlide"));
    const notesPath = notesRel
      ? normalizePath(slidePath.slice(0, slidePath.lastIndexOf("/")), notesRel.target)
      : null;
    const notesXml = notesPath ? (await zip.file(notesPath)?.async("string")) ?? "" : "";
    const tags = parseTags(extractText(notesXml) || extractText(slideXml));

    slideEntries.push({
      rId,
      slideId,
      slidePath,
      slideRelPath,
      notesPath,
      rawSlideId: match[0],
      tags,
    });
  }

  const keep = new Set(
    slideEntries
      .filter((slide) => shouldKeepSlide(slide.tags, filter))
      .map((slide) => slide.rId)
  );

  if (keep.size === 0) {
    throw new Error("Aucune slide ne correspond aux tags de cette offre.");
  }

  let nextPresentationXml = presentationXml;
  let nextPresentationRelsXml = presentationRelsXml;
  const pathsToRemove: string[] = [];
  const slideIdsToRemove: string[] = [];
  const keptSlides = slideEntries.filter((slide) => keep.has(slide.rId));
  const pageReplacements = buildPagePlaceholders(keptSlides);

  for (const slide of slideEntries) {
    if (keep.has(slide.rId)) continue;
    const rel = relById.get(slide.rId);
    nextPresentationXml = nextPresentationXml.replace(slide.rawSlideId, "");
    if (rel) nextPresentationRelsXml = nextPresentationRelsXml.replace(rel.raw, "");

    slideIdsToRemove.push(slide.slideId);
    pathsToRemove.push(slide.slidePath, slide.slideRelPath);
    if (slide.notesPath) pathsToRemove.push(slide.notesPath, relsPathForPart(slide.notesPath));
  }

  nextPresentationXml = removeSlideReferences(nextPresentationXml, slideIdsToRemove);

  for (const slide of slideEntries) {
    if (!keep.has(slide.rId)) continue;
    const slideFile = zip.file(slide.slidePath);
    if (!slideFile) continue;
    const slideXml = await slideFile.async("string");
    const slideHotelTags = slide.tags.get("HOTEL") ?? [];
    const slideHotelReplacements = slideHotelTags.reduce<PptxPlaceholderMap>(
      (acc, tag) => ({ ...acc, ...(hotelReplacements[normalizeToken(tag)] ?? {}) }),
      {}
    );
    zip.file(
      slide.slidePath,
      replacePlaceholdersInSlideXml(slideXml, {
        ...replacements,
        ...pageReplacements,
        ...slideHotelReplacements,
      })
    );
  }

  zip.file(PRESENTATION_PATH, nextPresentationXml);
  zip.file(PRESENTATION_RELS_PATH, nextPresentationRelsXml);

  const contentTypesFile = zip.file("[Content_Types].xml");
  if (contentTypesFile) {
    const contentTypesXml = await contentTypesFile.async("string");
    zip.file("[Content_Types].xml", removeOverrides(contentTypesXml, pathsToRemove));
  }

  for (const path of pathsToRemove) {
    zip.remove(path);
  }

  const generated = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return {
    buffer: generated,
    keptSlides: keep.size,
    removedSlides: slideEntries.length - keep.size,
  };
}
