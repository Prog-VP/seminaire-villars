import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mergeDocx, replaceOfferText } from "@/lib/docx-merge";

type DocItem =
  | { type: "block"; filePath: string }
  | { type: "hotel"; filePath: string; offerText?: string };

type GenerateBody = {
  items: DocItem[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody;
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Aucun document sélectionné." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const buffers: Buffer[] = [];

    for (const item of items) {
      const bucket =
        item.type === "block" ? "document-blocks" : "hotel-documents";

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(item.filePath);
      if (error || !data) {
        return NextResponse.json(
          { error: `Impossible de télécharger : ${item.filePath}` },
          { status: 500 }
        );
      }

      let buf: Buffer = Buffer.from(new Uint8Array(await data.arrayBuffer()));

      // Replace {{OFFER_TEXT}} placeholder in hotel documents
      if (item.type === "hotel" && item.offerText) {
        try {
          buf = await replaceOfferText(buf, item.offerText);
        } catch (err) {
          console.warn("[generate-offer-doc] replaceOfferText failed, using original:", err);
          // Fall back to original document without text replacement
        }
      }

      buffers.push(buf);
    }

    const docxContentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const merged = await mergeDocx(buffers);

    return new NextResponse(new Uint8Array(merged), {
      headers: {
        "Content-Type": docxContentType,
        "Content-Disposition": 'attachment; filename="document.docx"',
      },
    });
  } catch (error) {
    console.error("[generate-offer-doc]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
