import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractPDFText } from "./pdfExtractor";
import { chunkText } from "./chunk";
import { embedText, upsertEmbedding } from "./embeddings";
import { queryEmbeddings } from "./vectorSearch"; // ensure this path matches your project structure

// SAMPLE: Replace with your actual Supabase public URL and IDs
const publicUrl =
  "https://eortpunnsykhpmctvcxj.supabase.co/storage/v1/object/public/contexts/ws_9cd368a4-0658-4074-ab01-9b5b3cad3340/1751978073440_brand-guidelines.pdf";
const FILE_ID = "9cd368a4-0658-4074-ab01-9b5b3cad3340";
const NAMESPACE = "workspace";
const CHUNK_SIZE = 100; // characters per chunk
const CHUNK_OVERLAP = 0.2; // 20% overlap
const TOP_K = 5; // number of results for vector search

async function main() {
  try {
    // 1. Extract text from PDF
    // console.log("⏳ Extracting text from PDF...");
    // const text = await extractPDFText(publicUrl);
    // console.log(`✅ Extracted text length: ${text.length}`);

    // // 2. Chunk the text
    // console.log("⏳ Chunking text...");
    // const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    // console.log(
    //   `✅ Created ${chunks.length} chunks (size=${CHUNK_SIZE}, overlap=${CHUNK_OVERLAP * 100}%).`
    // );

    // // 3. Embed and upsert each chunk
    // for (let i = 0; i < chunks.length; i++) {
    //   const chunk = chunks[i];
    //   console.log(`⏳ Embedding chunk ${i + 1}/${chunks.length}...`);
    //   const embedding = await embedText(chunk);

    //   const id = `${FILE_ID}_${i}`;
    //   const metadata = {
    //     content: chunk,
    //     fileName: "brand-guidelines.pdf",
    //     chunkIndex: i,
    //     fileId: FILE_ID,
    //   };

    //   console.log(`⏳ Upserting embedding for chunk ${i} (id=${id})...`);
    //   await upsertEmbedding(id, NAMESPACE, FILE_ID, embedding, metadata);
    //   console.log(`✅ Upserted embedding for chunk ${i}`);
    // }

    // console.log("🎉 All embeddings processed and stored.");

    // 4. Perform a vector search test
    console.log("⏳ Testing vector search...");
    const query = "logo color"; // replace with your test query
    const results = await queryEmbeddings(query, NAMESPACE, FILE_ID);
    console.log(
      `✅ Vector search returned ${results.length} results for query: "${query}"`
    );
    results.forEach((res, idx) => {
      console.log(
        `${idx + 1}. [Score: ${res.score.toFixed(4)}] Chunk ID: ${res.id}`
      );
      console.log(
        `   Preview: ${res.content.substring(0, 100).replace(/\n/g, " ")}...`
      );
    });
  } catch (err) {
    console.error("❌ Error in test pipeline:", err);
    process.exit(1);
  }
}

main();
