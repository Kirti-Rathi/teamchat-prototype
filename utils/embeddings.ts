// import { createClient } from "@supabase/supabase-js";
// import { GoogleGenAI } from "@google/genai";
// import fs from "fs";
// import path from "path";

// // Initialize Supabase client
// type SupabaseConfig = {
//   url: string;
//   key: string;
// };
// const supabaseConfig: SupabaseConfig = {
//   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
// };
// const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

// const ai = new GoogleGenAI({});

// /**
//  * Reads chunks from disk and generates + stores embeddings.
//  * @param {Array<{ id: string; namespace: string; ref_id: string; fileName: string; }>} contexts
//  *        Each context object should contain an id (from workspace_contexts or chat_contexts),
//  *        namespace ('workspace' | 'chat'), ref_id (UUID of the context), and fileName (local PDF file name).
//  */
// export async function embedAndStoreContexts(contexts) {
//   for (const ctx of contexts) {
//     const filePath = path.resolve(process.cwd(), "pdfs", ctx.fileName);
//     if (!fs.existsSync(filePath)) {
//       console.warn(`File not found: ${filePath}, skipping`);
//       continue;
//     }

//     // Load pre-chunked content (assumes chunks saved as JSON in <fileName>.chunks.json)
//     const chunkFile = filePath.replace(/\.pdf$/, ".chunks.json");
//     let chunks;
//     try {
//       chunks = JSON.parse(fs.readFileSync(chunkFile, "utf8"));
//     } catch (err) {
//       console.error(`Failed to read chunks for ${ctx.fileName}:`, err);
//       continue;
//     }

//     for (let i = 0; i < chunks.length; i++) {
//       const text = chunks[i];

//       // Generate embedding with Gemini
//       const res = await ai.models.embedContent({
//         model: "gemini-embedding-exp-03-07",
//         contents: text,
//         config: {
//           taskType: "SEMANTIC_SIMILARITY",
//         },
//       });
//       const vector = res;
//       console.log("Vector:", vector);

//       // Create composite ID
//       const id = `${ctx.id}_${i}`;
//       console.log(
//         `Upserting embedding for ${ctx.namespace} with ID: ${id}, ref_id: ${ctx.ref_id}, chunkIndex: ${i}`
//       );

//       // Upsert into Supabase PGVector
//       const { error } = await supabase.from("embeddings").upsert(
//         {
//           id,
//           namespace: ctx.namespace,
//           ref_id: ctx.ref_id,
//           embedding: vector,
//           metadata: { fileName: ctx.fileName, chunkIndex: i },
//         },
//         { onConflict: "id" }
//       );

//       if (error) {
//         console.error(`Failed to upsert embedding ${id}:`, error);
//       } else {
//         console.log(`Upserted embedding ${id}`);
//       }
//     }
//   }
// }

// // Example invocation
// // (async () => {
// //   const contexts = [
// //     { id: 'workspace-123', namespace: 'workspace', ref_id: 'UUID-1', fileName: 'doc1.pdf' },
// //     { id: 'chat-456', namespace: 'chat', ref_id: 'UUID-2', fileName: 'doc2.pdf' },
// //   ];
// //   await embedAndStoreContexts(contexts);
// // })();
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate embeddings using Gemini
export async function embedText(text: string): Promise<number[]> {
  try {
    // const model = genai.getGenerativeModel({ model: "models/embedding-001" });
    // const result = await model.embedContent(text);
    // return result.embedding.values;
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
      },
    });

    return result.embeddings[0].values as Array<number>;
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw new Error("Failed to generate embeddings");
  }
}

// Upsert embeddings into Supabase
export async function upsertEmbedding(
  id: string,
  namespace: "workspace" | "chat",
  refId: string,
  vector: number[],
  metadata: {
    content: string;
    fileName: string;
    chunkIndex: number;
    refId: string;
  }
) {
  try {
    const { error } = await supabase.from("embeddings").upsert(
      {
        id,
        namespace,
        ref_id: refId,
        embedding: vector,
        metadata,
      },
      { onConflict: "id" }
    );

    if (error) throw error;
    console.log(`Upserted embedding for ${namespace}/${refId}`);
  } catch (error) {
    console.error("Embedding upsert error:", error);
    throw new Error("Failed to store embedding");
  }
}
