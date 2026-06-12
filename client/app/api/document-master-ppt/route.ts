import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MASTER_POWERPOINT = {
  destination: "master",
  season: "powerpoint",
  lang: "master",
};

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
    }
  | {
      action: "complete-upload";
      name: string;
      filePath: string;
    };

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

function getPowerPointExtension(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ext === "ppt" || ext === "pptx" ? ext : null;
}

function buildMasterFilePath(filename: string) {
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

  return `master/${Date.now()}_${safeName}.${ext}`;
}

function isValidMasterFilePath(filePath: string) {
  return /^master\/\d+_[a-zA-Z0-9_-]+\.(ppt|pptx)$/.test(filePath);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function fetchMasters() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("document_blocks")
    .select("id, destination, season, lang, name, file_path, created_at")
    .eq("destination", MASTER_POWERPOINT.destination)
    .eq("season", MASTER_POWERPOINT.season)
    .eq("lang", MASTER_POWERPOINT.lang)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as MasterRow[]);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const masters = await fetchMasters();
    const master = masters[0] ?? null;
    const url = new URL(request.url);

    if (url.searchParams.get("download") === "1") {
      if (!master) {
        return NextResponse.json(
          { error: "Aucun PowerPoint MASTER n'est enregistré." },
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

    return NextResponse.json({ master: master ? mapMaster(master) : null });
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

    if (body.action === "prepare-upload") {
      const filePath = buildMasterFilePath(body.name);
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

    if (body.action !== "complete-upload" || !isValidMasterFilePath(body.filePath)) {
      return NextResponse.json({ error: "Upload PowerPoint invalide." }, { status: 400 });
    }

    const fileName = body.filePath.replace("master/", "");
    const { data: uploadedFiles, error: listError } = await supabase.storage
      .from("document-blocks")
      .list("master", { search: fileName, limit: 1 });

    if (listError) throw new Error(listError.message);
    const uploadedFile = uploadedFiles?.find((file) => file.name === fileName);
    if (!uploadedFile) {
      return NextResponse.json({ error: "Upload PowerPoint introuvable." }, { status: 400 });
    }

    const existing = await fetchMasters();

    const { data, error: insertError } = await supabase
      .from("document_blocks")
      .insert({
        ...MASTER_POWERPOINT,
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

export async function DELETE() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const supabase = createAdminClient();
    const existing = await fetchMasters();

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
