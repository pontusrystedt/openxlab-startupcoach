import { Mistral } from "@mistralai/mistralai"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

export async function suggestCollections(
  title: string,
  text: string,
  availableCollections: Array<{ slug: string; name: string; description?: string | null }>
): Promise<string[]> {
  if (!text.trim()) return ["general"]

  const collectionList = availableCollections
    .map((c) => `- ${c.slug}: ${c.name}${c.description ? ` — ${c.description}` : ""}`)
    .join("\n")

  try {
    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: "user",
          content: `Analysera detta dokument och föreslå vilka samlingar det passar bäst i.
Välj 1-3 samlingar. Inkludera ALLTID "general" om dokumentet är relevant för alla agenter.

Tillgängliga samlingar:
${collectionList}

Dokument:
Titel: ${title}
Innehåll: ${text.slice(0, 2000)}

Svara ENBART som JSON-array med slug-värden, t.ex.: ["general", "pitch"]`,
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.1,
    })

    const raw = response.choices?.[0]?.message?.content ?? '["general"]'
    const cleaned =
      typeof raw === "string"
        ? raw.replace(/```json\n?|\n?```/g, "").trim()
        : '["general"]'

    const parsed = JSON.parse(cleaned)
    const arr = Array.isArray(parsed)
      ? parsed
      : (parsed.collections ?? parsed.suggested ?? ["general"])

    const validSlugs = availableCollections.map((c) => c.slug)
    const result = arr
      .filter((s: unknown) => typeof s === "string" && validSlugs.includes(s))
      .slice(0, 3) as string[]

    return result.length > 0 ? result : ["general"]
  } catch (err) {
    console.error("suggestCollections misslyckades:", err)
    return ["general"]
  }
}

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
