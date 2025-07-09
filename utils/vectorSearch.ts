import { embedText } from "./embeddings";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function queryEmbeddings(
  query: string,
  namespace: "workspace" | "chat",
  refId: string,
  topK: number = 5
): Promise<
  {
    id: string;
    content: string;
    fileName: string;
    score: number;
  }[]
> {
  try {
    // Generate query embedding
    const queryVector = await embedText(query);

    // Perform semantic similarity search
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: queryVector,
      match_count: topK,
      ref_id: refId,
      namespace,
    });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      content: item.metadata.content,
      fileName: item.metadata.fileName,
      score: item.similarity,
    }));
  } catch (error) {
    console.error("Vector search error:", error);
    return [];
  }
}
