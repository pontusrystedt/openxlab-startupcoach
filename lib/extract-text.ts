import mammoth from "mammoth"
// pdf-parse är ett CJS-paket utan ESM default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buffer: Buffer
) => Promise<{ text: string }>

const MAX_CHARS = 12000 // ~3000 tokens

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer)
      return data.text.slice(0, MAX_CHARS).trim()
    }

    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer })
      return result.value.slice(0, MAX_CHARS).trim()
    }

    if (mimeType.startsWith("text/")) {
      return buffer.toString("utf-8").slice(0, MAX_CHARS).trim()
    }
  } catch (err) {
    console.error("Textextraktion misslyckades:", err)
  }

  return "" // Bildformat och okända typer
}
