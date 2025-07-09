// import fs from "fs";
// import pdfParse from "pdf-parse";

// /**
//  * Creates chunks of text from PDF files for embeddings.
//  * @param {string} filePath - Path to the PDF file.
//  * @param {number} chunkSize - Maximum size of each chunk (in characters).
//  * @returns {Promise<Array<string>>} - Resolves to an array of text chunks.
//  */
// async function createChunk(filePath, chunkSize = 1000, overlap = 100) {
//   try {
//     const pdfBuffer = fs.readFileSync(filePath);
//     const pdfData = await pdfParse(pdfBuffer);
//     const text = pdfData.text;

//     // Split the text into chunks
//     const chunks = [];
//     for (let i = 0; i < text.length; i += chunkSize - overlap) {
//       chunks.push(text.slice(i, i + chunkSize));
//     }

//     console.log(`Created ${chunks.length} chunks from ${filePath}`);
//     return chunks;
//   } catch (error) {
//     console.error(`Failed to create chunks from ${filePath}:`, error);
//     throw error;
//   }
// }

// export { createChunk };

// Split text into chunks with overlap
export function chunkText(
  text: string,
  chunkSize: number = 2000,
  overlap: number = 0.2
): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  const step = Math.floor(chunkSize * (1 - overlap));

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end).trim();

    if (chunk) chunks.push(chunk);

    // Break if at the end
    if (end >= text.length) break;

    // Move forward with overlap
    start += step;
  }

  console.log(`Split text into ${chunks.length} chunks`);
  return chunks;
}
