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

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier PowerPoint." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["ppt", "pptx"].includes(ext)) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier PowerPoint (.ppt ou .pptx)." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const existing = await fetchMasters();
    const existingPaths = existing.map((block) => block.file_path);

    if (existingPaths.length > 0) {
      await supabase.storage.from("document-blocks").remove(existingPaths);
      const { error: deleteError } = await supabase
        .from("document_blocks")
        .delete()
        .in("id", existing.map((block) => block.id));
      if (deleteError) throw new Error(deleteError.message);
    }

    const safeName =
      file.name
        .replace(/\.[^.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "master";
    const filePath = `master/${Date.now()}_${safeName}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("document-blocks")
      .upload(filePath, buffer, {
        contentType:
          ext === "pptx"
            ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            : "application/vnd.ms-powerpoint",
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data, error: insertError } = await supabase
      .from("document_blocks")
      .insert({
        ...MASTER_POWERPOINT,
        name: file.name,
        file_path: filePath,
      })
      .select("id, destination, season, lang, name, file_path, created_at")
      .single<MasterRow>();

    if (insertError || !data) {
      await supabase.storage.from("document-blocks").remove([filePath]);
      throw new Error(insertError?.message ?? "Upload échoué.");
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
