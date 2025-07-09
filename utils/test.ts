import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { extractPDFText } from "./pdfExtractor";
import { chunkText } from "./chunk";
import { embedText, upsertEmbedding } from "./embeddings";

// SAMPLE: Replace with your actual Supabase public URL
const publicUrl =
  "https://eortpunnsykhpmctvcxj.supabase.co/storage/v1/object/public/contexts/ws_9cd368a4-0658-4074-ab01-9b5b3cad3340/1751873275890_brand-guidelines.pdf";

async function main() {
  try {
    // 1. Extract text from PDF
    const text = await extractPDFText(publicUrl);
    console.log("Extracted text length:", text.length);

    // 2. Chunk the text
    const chunks = chunkText(text, 500, 0.2); // 2000 chars, 20% overlap
    console.log(`Created ${chunks.length} chunks.`);

    // 3. For each chunk, create embedding and upsert
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      const id = `7d203131-d8b3-47d9-b360-6819c9d64976_${i}`;
      const namespace = "workspace"; // or "chat" as needed
      const refId = "7d203131-d8b3-47d9-b360-6819c9d64976"; // Replace with actual ref id if available
      const metadata = {
        content: chunk,
        fileName: "brand-guidelines.pdf",
        chunkIndex: i,
        fileId: "7d203131-d8b3-47d9-b360-6819c9d64976", // Replace with actual file id if available
      };
      await upsertEmbedding(id, namespace, refId, embedding, metadata);
      console.log(`Upserted embedding for chunk ${i}`);
    }
    console.log("All embeddings processed and stored.");
  } catch (err) {
    console.error("Error in test pipeline:", err);
  }
}

main();
