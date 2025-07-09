import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { queryEmbeddings } from "@/utils/vectorSearch";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const systemPrompt = `You are a helpful assistant that provides concise and accurate answers based on the provided context.`;

export async function POST(req: NextRequest) {
  try {
    // 1. Validate API key
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing Gemini API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse incoming request body
    const { workspaceId, chatId, userQuery, chatHistory } = await req.json();
    if (!chatId || !userQuery || !Array.isArray(chatHistory)) {
      return new Response(JSON.stringify({ error: "Invalid context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. get relevant context
    console.log("Calling queryEmbeddings with:", {
      userQuery,
      chatId,
      workspaceId,
    });
    const relevantContext = await getRelevantContext(
      userQuery,
      chatId,
      workspaceId
    );
    console.log(
      `Retrieved ${relevantContext.length} relevant context snippets`
    );

    // 4. Prepare context
    const contextHeader =
      relevantContext.length > 0
        ? `Relevant context:\n${relevantContext
            .map((s, i) => `[Source ${i + 1}: ${s.fileName}]\n${s.content}`)
            .join("\n\n---\n\n")}\n\n`
        : "No relevant context found.\n\n";

    // 5. Build final prompt
    const fullPrompt = `
    System: ${systemPrompt}

    ${contextHeader}

    Conversation history:
    ${chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}
    
    
    Current user query:
    ${userQuery}
    `;

    console.log("Prompt sent to Gemini:\n", fullPrompt);

    // 6. Initialize Gemini model
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await genai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        systemPrompt,
        contextHeader,
        chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n"),
        userQuery,
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    // 6. Wrap the async iterable into a ReadableStream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        }
      },
    });

    // Return the stream as response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("/api/ai error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function getRelevantContext(
  query: string,
  chatId: string,
  workspaceId?: string
) {
  const contextSnippets: {
    content: string;
    fileName: string;
    score: number;
  }[] = [];

  // Search workspace context
  if (workspaceId) {
    console.log(`Searching workspace context for ID: ${workspaceId}`);
    const workspaceResults = await queryEmbeddings(
      query,
      "workspace",
      workspaceId
    );
    console.log(`Found ${workspaceResults} results in workspace context`);
    contextSnippets.push(
      ...workspaceResults.map((r) => ({
        content: r.content,
        fileName: r.fileName,
        score: r.score,
      }))
    );
  }

  // Search chat context
  console.log(`Searching chat context for ID: ${chatId}`);
  const chatResults = await queryEmbeddings(query, "chat", chatId);
  console.log(`Found ${chatResults} results in chat context`);
  contextSnippets.push(
    ...chatResults.map((r) => ({
      content: r.content,
      fileName: r.fileName,
      score: r.score,
    }))
  );

  // Return top 5 by score
  return contextSnippets.sort((a, b) => b.score - a.score).slice(0, 5);
}
