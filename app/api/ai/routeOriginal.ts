// // import { NextRequest, NextResponse } from "next/server";
// // import { GoogleGenerativeAI } from "@google/generative-ai";

// // const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// // export async function POST(req: NextRequest) {
// //   try {
// //     if (!GEMINI_API_KEY) {
// //       return NextResponse.json(
// //         { error: "Missing Gemini API key" },
// //         { status: 500 }
// //       );
// //     }
// //     const { context } = await req.json();
// //     if (!Array.isArray(context)) {
// //       return NextResponse.json({ error: "Invalid context" }, { status: 400 });
// //     }
// //     // Prepare the prompt from context
// //     // const prompt = context
// //     //   .map((msg: { role: string; content: string }) =>
// //     //     `${msg.role === "assistant" ? "AI" : "User"}: ${msg.content}`
// //     //   )
// //     //   .join("\n");

// //     const prompt = context
// //       .map((msg: { role: string; content: string }) => msg.content)
// //       .join("\n\n");

// //     // console.log("Prompt sent to Gemini:\n", prompt);

// //     // Defensive: check for empty prompt
// //     if (!prompt.trim()) {
// //       return NextResponse.json({ reply: "No context provided." });
// //     }

// //     try {
// //       const genai = new GoogleGenerativeAI(GEMINI_API_KEY);
// //       const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
// //       const result = await model.generateContent(prompt);
// //       const reply = result.response.text();
// //       return NextResponse.json({
// //         reply: reply?.trim() || "Sorry, I could not generate a reply.",
// //       });
// //     } catch (err: any) {
// //       // Log Gemini API errors for debugging
// //       console.error("Gemini API error:", err);
// //       return NextResponse.json(
// //         { error: err.message || "Gemini API error" },
// //         { status: 500 }
// //       );
// //     }
// //   } catch (error: any) {
// //     // Log unexpected errors
// //     console.error("/api/ai error:", error);
// //     return NextResponse.json(
// //       { error: error.message || "Internal server error" },
// //       { status: 500 }
// //     );
// //   }
// // }

// =============== CORRECT VERSION BACKUP ===============

// import { NextRequest } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// export async function POST(req: NextRequest) {
//   try {
//     // Validate API key
//     if (!GEMINI_API_KEY) {
//       return new Response(JSON.stringify({ error: "Missing Gemini API key" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Parse incoming request body
//     const { context } = await req.json();
//     if (!Array.isArray(context)) {
//       return new Response(JSON.stringify({ error: "Invalid context" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Combine messages into prompt
//     const prompt = context
//       .map((msg: { role: string; content: string }) => msg.content)
//       .join("\n\n");

//     if (!prompt.trim()) {
//       return new Response("No content provided", { status: 400 });
//     }

//     console.log("Prompt sent to Gemini:\n", prompt);

//     // Initialize Gemini model
//     const genai = new GoogleGenerativeAI(GEMINI_API_KEY);
//     const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

//     // Generate content as stream (async iterable)
//     const result = await model.generateContentStream(prompt);

//     const encoder = new TextEncoder();

//     // Wrap the async iterable into a ReadableStream
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           for await (const chunk of result.stream) {
//             const text = chunk.text();
//             controller.enqueue(encoder.encode(text));
//           }
//           controller.close();
//         } catch (err) {
//           console.error("Streaming error:", err);
//           controller.error(err);
//         }
//       },
//     });

//     // Return the stream as response
//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/plain; charset=utf-8",
//         "Cache-Control": "no-cache",
//         "X-Content-Type-Options": "nosniff",
//       },
//     });
//   } catch (error: any) {
//     console.error("/api/ai error:", error);
//     return new Response(
//       JSON.stringify({ error: error.message || "Internal server error" }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// }

import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing Gemini API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse incoming request body
    const { userQuery } = await req.json();
    // if (!Array.isArray(context)) {
    //   return new Response(JSON.stringify({ error: "Invalid context" }), {
    //     status: 400,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // Combine messages into prompt
    // const prompt = context
    //   .map((msg: { role: string; content: string }) => msg.content)
    //   .join("\n\n");

    // if (!prompt.trim()) {
    //   return new Response("No content provided", { status: 400 });
    // }

    console.log("Prompt sent to Gemini:\n", userQuery);

    // Initialize Gemini model
    const genai = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate content as stream (async iterable)
    const result = await model.generateContentStream(userQuery);

    const encoder = new TextEncoder();

    // Wrap the async iterable into a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
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
