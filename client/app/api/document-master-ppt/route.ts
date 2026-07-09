import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MASTER_POWERPOINT = {
  destination: "master",
  season: "powerpoint",
};

const MASTER_POWERPOINT_LANGS = ["FR", "EN", "DE"] as const;
const LEGACY_MASTER_POWERPOINT_LANG = "master";

type MasterPowerPointLang = (typeof MASTER_POWERPOINT_LANGS)[number];

type MasterRow = {
  id: string;
  destination: string;
  season: string;
  lang: string;
  name: string;
  file_path: string;
  created_at: string;
};

type UploadRequestBody =
  | {
      action: "prepare-upload";
      name: string;
      lang?: string | null;
    }
  | {
      action: "complete-upload";
      name: string;
      filePath: string;
      lang?: string | null;
    };

type MasterPayload = Record<MasterPowerPointLang, ReturnType<typeof mapMaster> | null>;

function emptyMasterPayload(): MasterPayload {
  return {
    FR: null,
    EN: null,
    DE: null,
  };
}

function mapMaster(row: MasterRow) {
  return {
    id: row.id,
    destination: row.destination,
    season: row.season,
    lang: row.lang,
    name: row.name,
    filePath: row.file_path,
    createdAt: row.created_at,
  };
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizeMasterLang(value?: string | null): MasterPowerPointLang | null {
  const normalized = normalizeToken(value ?? "");
  if (normalized.includes("EN") || normalized.includes("ANGLAIS")) return "EN";
  if (normalized.includes("DE") || normalized.includes("ALLEMAND")) return "DE";
  if (normalized.includes("FR") || normalized.includes("FRANCAIS")) return "FR";
  return null;
}

function requireMasterLang(value?: string | null) {
  return normalizeMasterLang(value) ?? "FR";
}

function getPowerPointExtension(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ext === "ppt" || ext === "pptx" ? ext : null;
}

function buildMasterFilePath(filename: string, lang: MasterPowerPointLang) {
  const ext = getPowerPointExtension(filename);
  if (!ext) return null;

  const safeName =
    filename
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "master";

  return `master/${lang.toLowerCase()}/${Date.now()}_${safeName}.${ext}`;
}

function isValidMasterFilePath(filePath: string, lang: MasterPowerPointLang) {
  const prefix = `master/${lang.toLowerCase()}`;
  return new RegExp(`^${prefix}/\\d+_[a-zA-Z0-9_-]+\\.(ppt|pptx)$`).test(filePath);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function fetchMasters(lang?: MasterPowerPointLang) {
  const supabase = createAdminClient();
  let query = supabase
    .from("document_blocks")
    .select("id, destination, season, lang, name, file_path, created_at")
    .eq("destination", MASTER_POWERPOINT.destination)
    .eq("season", MASTER_POWERPOINT.season)
    .order("created_at", { ascending: false });

  if (lang) {
    query = query.eq("lang", lang);
  } else {
    query = query.in("lang", [...MASTER_POWERPOINT_LANGS, LEGACY_MASTER_POWERPOINT_LANG]);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return ((data ?? []) as MasterRow[]);
}

function groupMasters(rows: MasterRow[]) {
  const masters = emptyMasterPayload();
  let legacyMaster: ReturnType<typeof mapMaster> | null = null;

  for (const row of rows) {
    const lang = normalizeMasterLang(row.lang);
    if (lang && !masters[lang]) {
      masters[lang] = mapMaster(row);
    } else if (row.lang === LEGACY_MASTER_POWERPOINT_LANG && !legacyMaster) {
      legacyMaster = mapMaster(row);
    }
  }

  return { masters, legacyMaster };
}

async function fetchLatestMaster(lang: MasterPowerPointLang) {
  const rows = await fetchMasters();
  return (
    rows.find((row) => row.lang === lang) ??
    rows.find((row) => row.lang === LEGACY_MASTER_POWERPOINT_LANG) ??
    null
  );
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const url = new URL(request.url);

    if (url.searchParams.get("download") === "1") {
      const lang = requireMasterLang(url.searchParams.get("lang"));
      const master = await fetchLatestMaster(lang);

      if (!master) {
        return NextResponse.json(
          { error: `Aucun PowerPoint MASTER ${lang} n'est enregistré.` },
          { status: 404 }
        );
      }

      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from("document-blocks")
        .createSignedUrl(master.file_path, 60, { download: master.name });

      if (error || !data?.signedUrl) {
        return NextResponse.json(
          { error: error?.message ?? "Impossible de créer le lien de téléchargement." },
          { status: 500 }
        );
      }

      return NextResponse.redirect(data.signedUrl);
    }

    const masters = await fetchMasters();
    return NextResponse.json(groupMasters(masters));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const body = (await request.json().catch(() => null)) as UploadRequestBody | null;
    if (!body?.action) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier PowerPoint." },
        { status: 400 }
      );
    }

    if (!body.name || !getPowerPointExtension(body.name)) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier PowerPoint (.ppt ou .pptx)." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const lang = requireMasterLang(body.lang);

    if (body.action === "prepare-upload") {
      const filePath = buildMasterFilePath(body.name, lang);
      if (!filePath) {
        return NextResponse.json(
          { error: "Veuillez sélectionner un fichier PowerPoint (.ppt ou .pptx)." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.storage
        .from("document-blocks")
        .createSignedUploadUrl(filePath, { upsert: false });

      if (error || !data?.token) {
        throw new Error(error?.message ?? "Impossible de préparer l'upload.");
      }

      return NextResponse.json({
        filePath,
        token: data.token,
      });
    }

    if (body.action !== "complete-upload" || !isValidMasterFilePath(body.filePath, lang)) {
      return NextResponse.json({ error: "Upload PowerPoint invalide." }, { status: 400 });
    }

    const folder = `master/${lang.toLowerCase()}`;
    const fileName = body.filePath.replace(`${folder}/`, "");
    const { data: uploadedFiles, error: listError } = await supabase.storage
      .from("document-blocks")
      .list(folder, { search: fileName, limit: 1 });

    if (listError) throw new Error(listError.message);
    const uploadedFile = uploadedFiles?.find((file) => file.name === fileName);
    if (!uploadedFile) {
      return NextResponse.json({ error: "Upload PowerPoint introuvable." }, { status: 400 });
    }

    const existing = await fetchMasters(lang);

    const { data, error: insertError } = await supabase
      .from("document_blocks")
      .insert({
        ...MASTER_POWERPOINT,
        lang,
        name: body.name,
        file_path: body.filePath,
      })
      .select("id, destination, season, lang, name, file_path, created_at")
      .single<MasterRow>();

    if (insertError || !data) {
      await supabase.storage.from("document-blocks").remove([body.filePath]);
      throw new Error(insertError?.message ?? "Upload échoué.");
    }

    const existingIds = existing.map((block) => block.id);
    if (existingIds.length > 0) {
      const pathsToRemove = existing
        .map((block) => block.file_path)
        .filter((filePath) => filePath !== body.filePath);
      if (pathsToRemove.length > 0) {
        await supabase.storage.from("document-blocks").remove(pathsToRemove);
      }

      const { error: deleteError } = await supabase
        .from("document_blocks")
        .delete()
        .in("id", existingIds);
      if (deleteError) throw new Error(deleteError.message);
    }

    return NextResponse.json({ master: mapMaster(data) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const supabase = createAdminClient();
    const requestUrl = new URL(request.url);
    const lang = normalizeMasterLang(requestUrl.searchParams.get("lang"));
    const existing = lang ? await fetchMasters(lang) : await fetchMasters();

    if (existing.length > 0) {
      const paths = existing.map((block) => block.file_path);
      await supabase.storage.from("document-blocks").remove(paths);
      const { error } = await supabase
        .from("document_blocks")
        .delete()
        .in("id", existing.map((block) => block.id));
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne." },
      { status: 500 }
    );
  }
}
