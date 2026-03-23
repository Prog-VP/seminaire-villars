#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");

const JSZip = require("jszip");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

const CLIENT_DIR = path.resolve(__dirname, "..");
const PROJECT_DIR = path.resolve(CLIENT_DIR, "..");
const ENV_PATH = path.join(CLIENT_DIR, ".env.local");
const DOCX_MERGE_PATH = path.join(CLIENT_DIR, "lib", "docx-merge.ts");
const OUTPUT_DIR = path.join(os.tmpdir(), "docx-debug-villars-de");
const XMLLINT = process.env.XMLLINT_PATH || "xmllint";
const SECT_PR_REGEX = /<w:sectPr\b[^>]*\/>|<w:sectPr\b[\s\S]*?<\/w:sectPr>/g;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadTsModule(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  });

  const loadedModule = new Module(filePath, module.parent);
  loadedModule.filename = filePath;
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filePath));
  loadedModule._compile(transpiled.outputText, filePath);
  return loadedModule.exports;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeFilePart(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "unnamed";
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, data) {
  writeText(filePath, JSON.stringify(data, null, 2));
}

function compactXml(xml, maxLength = 500) {
  const compact = xml.replace(/\s+/g, " ").trim();
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength)}...`;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function collectMatches(xml, regex, mapMatch) {
  const results = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(mapMatch(match));
  }
  return results;
}

function parseRootTag(xml) {
  return xml.match(/<w:document\b[^>]*>/)?.[0] ?? "";
}

function parseNamespaceDeclarations(rootTag) {
  const declarations = {};
  for (const match of rootTag.matchAll(/\sxmlns:([A-Za-z0-9_-]+)="([^"]+)"/g)) {
    declarations[match[1]] = match[2];
  }
  return declarations;
}

function collectNamespaceDeclarations(xml) {
  const declarations = {};
  for (const match of xml.matchAll(/\sxmlns:([A-Za-z0-9_-]+)="([^"]+)"/g)) {
    declarations[match[1]] = match[2];
  }
  return declarations;
}

function parseMcIgnorable(rootTag) {
  const raw = rootTag.match(/\smc:Ignorable="([^"]*)"/)?.[1] ?? "";
  const prefixes = raw
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    raw,
    prefixes: uniqueSorted(prefixes),
  };
}

function collectUsedPrefixes(xml) {
  const prefixes = new Set();

  for (const match of xml.matchAll(/<(?:\/)?([A-Za-z0-9_-]+):[A-Za-z0-9_-]+(?:\s|>|\/)/g)) {
    prefixes.add(match[1]);
  }

  for (const match of xml.matchAll(/\s([A-Za-z0-9_-]+):[A-Za-z0-9_-]+="/g)) {
    if (match[1] !== "xmlns") {
      prefixes.add(match[1]);
    }
  }

  return uniqueSorted(prefixes);
}

function collectRelationshipIds(xml) {
  return uniqueSorted(
    collectMatches(xml, /\br:(?:embed|id|link)="([^"]+)"/g, (match) => match[1])
  );
}

function parseRelationshipIds(relsXml) {
  return new Set(
    collectMatches(
      relsXml,
      /<Relationship\s+[^>]*\bId="([^"]+)"/g,
      (match) => match[1]
    )
  );
}

function collectDocPrIds(xml) {
  return collectMatches(xml, /<wp:docPr\b[^>]*\bid="(\d+)"/g, (match) =>
    Number(match[1])
  );
}

function findDuplicateNumbers(numbers) {
  const seen = new Set();
  const duplicates = new Set();

  for (const number of numbers) {
    if (seen.has(number)) {
      duplicates.add(number);
    }
    seen.add(number);
  }

  return [...duplicates].sort((a, b) => a - b);
}

function collectSectPrSnippets(xml) {
  return collectMatches(
    xml,
    SECT_PR_REGEX,
    (match) => compactXml(match[0], 600)
  );
}

function summarizeXml(xml, relsXml) {
  const rootTag = parseRootTag(xml);
  const rootNamespaces = parseNamespaceDeclarations(rootTag);
  const declaredNamespaces = collectNamespaceDeclarations(xml);
  const usedPrefixes = collectUsedPrefixes(xml);
  const missingNamespaceDeclarations = usedPrefixes.filter(
    (prefix) => prefix !== "xml" && !(prefix in declaredNamespaces)
  );

  const mcIgnorable = parseMcIgnorable(rootTag);
  const ignorableMissing = usedPrefixes.filter(
    (prefix) =>
      /^(?:w1[4-9]|w2\d|wp14|cx\d+|aink|am3d)$/.test(prefix) &&
      !mcIgnorable.prefixes.includes(prefix)
  );

  const referencedRelIds = collectRelationshipIds(xml);
  const declaredRelIds = parseRelationshipIds(relsXml);
  const unresolvedRelIds = referencedRelIds.filter((id) => !declaredRelIds.has(id));

  const docPrIds = collectDocPrIds(xml);
  const sectPrSnippets = collectSectPrSnippets(xml);

  return {
    rootTag: compactXml(rootTag, 800),
    namespaceDeclarations: rootNamespaces,
    allDeclaredNamespaces: declaredNamespaces,
    usedPrefixes,
    missingNamespaceDeclarations,
    mcIgnorable,
    ignorableMissing,
    referencedRelIds,
    unresolvedRelIds,
    docPrIdSummary: {
      count: docPrIds.length,
      max: docPrIds.length > 0 ? Math.max(...docPrIds) : null,
      duplicates: findDuplicateNumbers(docPrIds),
    },
    counts: {
      paragraphs: (xml.match(/<w:p\b/g) ?? []).length,
      inlineSectPr: (xml.match(/<w:pPr[\s\S]*?<w:sectPr\b/g) ?? []).length,
      sectPr: sectPrSnippets.length,
      alternateContent: (xml.match(/<mc:AlternateContent\b/g) ?? []).length,
      altChunk: (xml.match(/<w:altChunk\b/g) ?? []).length,
      drawings: (xml.match(/<w:drawing\b/g) ?? []).length,
      pict: (xml.match(/<w:pict\b/g) ?? []).length,
      object: (xml.match(/<w:object\b/g) ?? []).length,
      footnoteReference: (xml.match(/<w:footnoteReference\b/g) ?? []).length,
      endnoteReference: (xml.match(/<w:endnoteReference\b/g) ?? []).length,
      sdt: (xml.match(/<w:sdt\b/g) ?? []).length,
      txbxContent: (xml.match(/<w:txbxContent\b/g) ?? []).length,
    },
    sectPrSnippets: sectPrSnippets.slice(0, 5),
  };
}

function validateXmlWithXmllint(xml) {
  try {
    execFileSync(XMLLINT, ["--noout", "-"], {
      input: xml,
      stdio: ["pipe", "pipe", "pipe"],
      cwd: PROJECT_DIR,
    });
    return { ok: true };
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr) : String(error.message);
    return {
      ok: false,
      error: stderr.trim(),
    };
  }
}

async function inspectDocxBuffer(buffer, label, outputBasePath) {
  const result = {
    label,
    zipOk: false,
    xmlOk: false,
    ok: false,
  };

  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
    result.zipOk = true;
  } catch (error) {
    result.zipError = error instanceof Error ? error.message : String(error);
    return result;
  }

  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    result.xmlError = "word/document.xml not found";
    return result;
  }

  const documentXml = await documentFile.async("string");
  const relsXml =
    (await zip.file("word/_rels/document.xml.rels")?.async("string")) ?? "";

  const docXmlPath = `${outputBasePath}.document.xml`;
  writeText(docXmlPath, documentXml);

  const relsPath = `${outputBasePath}.document.xml.rels`;
  writeText(relsPath, relsXml);

  const xmlValidation = validateXmlWithXmllint(documentXml);
  result.xmlOk = xmlValidation.ok;
  if (!xmlValidation.ok) {
    result.xmlError = xmlValidation.error;
  }

  result.analysis = summarizeXml(documentXml, relsXml);
  result.paths = {
    documentXml: docXmlPath,
    documentRelsXml: relsPath,
  };
  result.ok = result.zipOk && result.xmlOk;
  return result;
}

async function fetchVillarsDeBlocks(supabase) {
  const { data, error } = await supabase
    .from("document_blocks")
    .select("id, destination, season, lang, name, file_path, created_at")
    .eq("destination", "villars")
    .eq("lang", "de")
    .order("season")
    .order("name");

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return data ?? [];
}

async function downloadBlock(supabase, row) {
  const { data, error } = await supabase.storage
    .from("document-blocks")
    .download(row.file_path);

  if (error || !data) {
    throw new Error(
      `Storage download failed for ${row.file_path}: ${error?.message ?? "unknown error"}`
    );
  }

  return Buffer.from(new Uint8Array(await data.arrayBuffer()));
}

function printBlockList(rows) {
  console.log(`Found ${rows.length} villars/de blocks:`);
  rows.forEach((row, index) => {
    console.log(
      `${String(index + 1).padStart(2, "0")}. [${row.season}] ${row.name} -> ${row.file_path}`
    );
  });
}

function printStepResult(stepNumber, total, row, inspection, outputPath) {
  const status = inspection.ok ? "OK" : "FAIL";
  console.log(
    `[${status}] step ${stepNumber}/${total} after adding "${row.name}" (${row.file_path})`
  );
  console.log(`      merged file: ${outputPath}`);
  if (!inspection.ok) {
    if (inspection.zipError) console.log(`      zip error: ${inspection.zipError}`);
    if (inspection.xmlError) console.log(`      xml error: ${inspection.xmlError}`);
  }

  const { analysis } = inspection;
  if (!analysis) return;

  if (analysis.missingNamespaceDeclarations.length > 0) {
    console.log(
      `      missing xmlns: ${analysis.missingNamespaceDeclarations.join(", ")}`
    );
  }
  if (analysis.ignorableMissing.length > 0) {
    console.log(
      `      missing mc:Ignorable prefixes: ${analysis.ignorableMissing.join(", ")}`
    );
  }
  if (analysis.unresolvedRelIds.length > 0) {
    console.log(`      unresolved rIds: ${analysis.unresolvedRelIds.join(", ")}`);
  }
  if (analysis.docPrIdSummary.duplicates.length > 0) {
    console.log(
      `      duplicate wp:docPr ids: ${analysis.docPrIdSummary.duplicates.join(", ")}`
    );
  }
}

async function main() {
  loadEnvFile(ENV_PATH);
  ensureDir(OUTPUT_DIR);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Missing Supabase credentials. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }

  const { mergeDocx } = loadTsModule(DOCX_MERGE_PATH);
  if (typeof mergeDocx !== "function") {
    throw new Error(`Unable to load mergeDocx from ${DOCX_MERGE_PATH}`);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = await fetchVillarsDeBlocks(supabase);
  if (rows.length === 0) {
    console.log("No villars/de blocks found.");
    return;
  }

  printBlockList(rows);

  const blocks = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const safeBase = `${String(index + 1).padStart(2, "0")}-${sanitizeFilePart(row.name)}`;
    const buffer = await downloadBlock(supabase, row);
    const originalDocxPath = path.join(OUTPUT_DIR, `${safeBase}.original.docx`);
    fs.writeFileSync(originalDocxPath, buffer);

    const inspection = await inspectDocxBuffer(
      buffer,
      row.name,
      path.join(OUTPUT_DIR, `${safeBase}.original`)
    );

    writeJson(path.join(OUTPUT_DIR, `${safeBase}.original.report.json`), {
      row,
      originalDocxPath,
      inspection,
    });

    blocks.push({
      row,
      safeBase,
      buffer,
      originalDocxPath,
      originalInspection: inspection,
    });
  }

  let firstFailure = null;

  for (let index = 0; index < blocks.length; index++) {
    const subset = blocks.slice(0, index + 1);
    const mergedBuffer = await mergeDocx(subset.map((block) => block.buffer));
    const mergedDocxPath = path.join(
      OUTPUT_DIR,
      `${String(index + 1).padStart(2, "0")}-merged.docx`
    );
    fs.writeFileSync(mergedDocxPath, mergedBuffer);

    const inspection = await inspectDocxBuffer(
      mergedBuffer,
      `step-${index + 1}`,
      path.join(OUTPUT_DIR, `${String(index + 1).padStart(2, "0")}-merged`)
    );

    const report = {
      step: index + 1,
      outputPath: mergedDocxPath,
      blocks: subset.map((block) => ({
        id: block.row.id,
        season: block.row.season,
        name: block.row.name,
        filePath: block.row.file_path,
      })),
      inspection,
    };

    writeJson(
      path.join(OUTPUT_DIR, `${String(index + 1).padStart(2, "0")}-merged.report.json`),
      report
    );

    printStepResult(index + 1, blocks.length, blocks[index].row, inspection, mergedDocxPath);

    if (!inspection.ok && !firstFailure) {
      firstFailure = {
        step: index + 1,
        culprit: blocks[index],
        mergedDocxPath,
        inspection,
        subset,
      };
      break;
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    outputDir: OUTPUT_DIR,
    blocks: blocks.map((block, index) => ({
      order: index + 1,
      id: block.row.id,
      season: block.row.season,
      name: block.row.name,
      filePath: block.row.file_path,
      originalDocxPath: block.originalDocxPath,
      originalInspection: block.originalInspection,
    })),
    firstFailure: firstFailure
      ? {
          step: firstFailure.step,
          culprit: {
            id: firstFailure.culprit.row.id,
            season: firstFailure.culprit.row.season,
            name: firstFailure.culprit.row.name,
            filePath: firstFailure.culprit.row.file_path,
          },
          mergedDocxPath: firstFailure.mergedDocxPath,
          inspection: firstFailure.inspection,
          previousBlockCount: firstFailure.step - 1,
        }
      : null,
  };

  if (firstFailure) {
    const culpritReport = {
      culprit: {
        row: firstFailure.culprit.row,
        originalInspection: firstFailure.culprit.originalInspection,
      },
      mergedFailure: firstFailure.inspection,
      previousStep:
        firstFailure.step > 1
          ? {
              blockCount: firstFailure.step - 1,
              blocks: firstFailure.subset.slice(0, -1).map((block) => ({
                id: block.row.id,
                season: block.row.season,
                name: block.row.name,
                filePath: block.row.file_path,
              })),
            }
          : null,
    };

    writeJson(path.join(OUTPUT_DIR, "failure-analysis.json"), culpritReport);

    console.log("");
    console.log(`First failing step: ${firstFailure.step}`);
    console.log(`Likely culprit block: ${firstFailure.culprit.row.name}`);
    console.log(`Failure analysis: ${path.join(OUTPUT_DIR, "failure-analysis.json")}`);
  } else {
    console.log("");
    console.log("All progressive merges produced a valid ZIP with well-formed word/document.xml.");
  }

  writeJson(path.join(OUTPUT_DIR, "summary.json"), summary);
  console.log(`Summary: ${path.join(OUTPUT_DIR, "summary.json")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
