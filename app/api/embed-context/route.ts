import { NextResponse } from "next/server";
import { processAndEmbedContextFile } from "@/utils/processAndEmbedContextFile";

export async function POST(req: Request) {
  const { publicUrl, fileName, namespace, refId } = await req.json();
  try {
    console.log("Starting embedding for:", {
      publicUrl,
      fileName,
      namespace,
      refId,
    });

    await processAndEmbedContextFile({ publicUrl, fileName, namespace, refId });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Embed-context API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic"; // Ensure this route is always fresh
