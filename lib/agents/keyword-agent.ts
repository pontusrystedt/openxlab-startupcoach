import { Mistral } from "@mistralai/mistralai"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

export async function generateKeywords(
  title: string,
  text: string
): Promise<string[]> {
  try {
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            "Du är en assistent som extraherar nyckelord. Svara ALLTID som giltig JSON: { \"keywords\": [\"ord1\", \"ord2\", ...] }. Max 8 nyckelord, på svenska, relevanta för innehållet.",
        },
        {
          role: "user",
          content: `Titel: ${title}\n\nText (utdrag):\n${text.slice(0, 2000)}`,
        },
      ],
      responseFormat: { type: "json_object" },
    })

    const raw =
      typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "{}"

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : []
  } catch (err) {
    console.error("Keyword-agent misslyckades:", err)
    return []
  }
}
