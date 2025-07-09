import { extractPDFText } from "./pdfExtractor";
import { chunkText } from "./chunk";
import { embedText, upsertEmbedding } from "./embeddings";

export async function processAndEmbedContextFile({
  publicUrl,
  refId,
  fileName,
  namespace,
  chunkSize = 100,
  chunkOverlap = 0.2,
}: {
  publicUrl: string;
  fileName: string;
  namespace: "workspace" | "chat";
  refId: string;
  chunkSize?: number; // default 100 characters
  chunkOverlap?: number; // default 0.2 (20% overlap)
}) {
  try {
    console.log("Processing and embedding context file:", {
      publicUrl,
      refId,
      fileName,
      namespace,
      chunkSize,
      chunkOverlap,
    });
    // 1. Extract text from PDF (or other file types as needed)
    const text = await extractPDFText(publicUrl);
    console.log("Extracted text length:", text.length);

    // 2. Chunk the text
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    console.log(`Created ${chunks.length} chunks.`);

    // 3. For each chunk, create embedding and upsert
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      const id = `${refId}_${i}`;
      const metadata = {
        content: chunk,
        fileName,
        chunkIndex: i,
        refId,
      };
      await upsertEmbedding(id, namespace, refId, embedding, metadata);
      console.log(`Upserted embedding for chunk ${i}`);
    }
  } catch (error) {
    console.error("Error processing and embedding context file:", error);
  }
}
