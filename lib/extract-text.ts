import mammoth from "mammoth"
import { extractText as extractPdf } from "unpdf"
import { Mistral } from "@mistralai/mistralai"

const MAX_CHARS = 12000 // ~3000 tokens

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/tiff"]

async function ocrImage(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) return ""
  const client = new Mistral({ apiKey })
  const base64 = buffer.toString("base64")
  const response = await client.chat.complete({
    model: "pixtral-12b-2409",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            imageUrl: { url: `data:${mimeType};base64,${base64}` },
          },
          {
            type: "text",
            text: "Extrahera all text ur denna bild. Returnera bara texten, inga kommentarer.",
          },
        ],
      },
    ],
  })
  const content = response.choices?.[0]?.message?.content
  return typeof content === "string" ? content : ""
}

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const { text } = await extractPdf(new Uint8Array(buffer), {
        mergePages: true,
      })
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

    if (IMAGE_TYPES.includes(mimeType)) {
      const text = await ocrImage(buffer, mimeType)
      return text.slice(0, MAX_CHARS).trim()
    }
  } catch (err) {
    console.error("Textextraktion misslyckades:", err)
  }

  return "" // Okänt format
}
