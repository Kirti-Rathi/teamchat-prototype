import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }
    const { context } = await req.json();
    if (!Array.isArray(context)) {
      return NextResponse.json({ error: "Invalid context" }, { status: 400 });
    }
    // Prepare the prompt from context
    // const prompt = context
    //   .map((msg: { role: string; content: string }) =>
    //     `${msg.role === "assistant" ? "AI" : "User"}: ${msg.content}`
    //   )
    //   .join("\n");

    const prompt = context
      .map((msg: { role: string; content: string }) => msg.content)
      .join("\n\n");

    // console.log("Prompt sent to Gemini:\n", prompt);

    // Defensive: check for empty prompt
    if (!prompt.trim()) {
      return NextResponse.json({ reply: "No context provided." });
    }

    try {
      const genai = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const reply = result.response.text();
      return NextResponse.json({
        reply: reply?.trim() || "Sorry, I could not generate a reply.",
      });
    } catch (err: any) {
      // Log Gemini API errors for debugging
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: err.message || "Gemini API error" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Log unexpected errors
    console.error("/api/ai error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
