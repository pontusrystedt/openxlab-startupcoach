import mammoth from "mammoth"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"

// Inaktivera worker – körs i Node.js-miljö
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(pdfjs as any).GlobalWorkerOptions = (pdfjs as any).GlobalWorkerOptions ?? {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(pdfjs as any).GlobalWorkerOptions.workerSrc = ""

const MAX_CHARS = 12000 // ~3000 tokens

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = (pdfjs as any).getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages.push(content.items.map((item: any) => ("str" in item ? item.str : "")).join(" "))
  }
  return pages.join("\n")
}

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const text = await extractPdfText(buffer)
      return text.slice(0, MAX_CHARS).trim()
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
