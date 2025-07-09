// import fs from "fs";
// import path from "path";
// import axios from "axios";

// /**
//  * Extracts PDF files from the given public URLs for chat_contexts and workspace_contexts.
//  * @param {Array} contexts - Array of context objects containing publicUrl and other metadata.
//  * @param {string} outputDir - Directory to save the extracted PDFs.
//  * @returns {Promise<void>} - Resolves when all PDFs are downloaded.
//  */
// async function extractPDFs(contexts, outputDir) {
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   for (const context of contexts) {
//     const { public_url, file_name } = context;
//     const filePath = path.join(outputDir, file_name);

//     try {
//       const response = await axios.get(public_url, {
//         responseType: "arraybuffer",
//       });
//       fs.writeFileSync(filePath, response.data);
//       console.log(`PDF saved: ${filePath}`);
//     } catch (error) {
//       console.error(`Failed to download PDF from ${public_url}:`, error);
//     }
//   }
// }

// export { extractPDFs };

import pdf from "pdf-parse";
/**
 * Extracts text from a PDF file given its public URL.
 * @param {string} publicUrl - The public URL of the PDF file.
 * @returns {Promise<string>} - The extracted text from the PDF.
 * @throws {Error} - If the PDF cannot be fetched or parsed.
 */

export async function extractPDFText(publicUrl: string): Promise<string> {
  try {
    // Fetch PDF content
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from URL: ${publicUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using pdf-parse
    const { text } = await pdf(buffer);
    return text;
  } catch (error) {
    console.error(`PDF extraction error for ${publicUrl}:`, error);
    throw new Error("Failed to extract PDF text");
  }
}
