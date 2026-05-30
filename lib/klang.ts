import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

export async function getUserKlangKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { klangApiKey: true },
  })
  if (!user?.klangApiKey) return null
  try {
    const stored = JSON.parse(user.klangApiKey) as {
      encryptedText: string
      iv: string
      authTag: string
    }
    return decrypt(stored.encryptedText, stored.iv, stored.authTag)
  } catch {
    return null
  }
}

export async function fetchKlangTranscript(
  conversationId: string,
  apiKey: string
): Promise<string | null> {
  const res = await fetch(
    `https://app.klang.ai/api/v1/conversations/${conversationId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  if (!res.ok) {
    console.error(
      `Klang API svarade ${res.status} för konversation ${conversationId}`
    )
    return null
  }
  const data = await res.json()
  const transcriptSource = data.sources?.find(
    (s: { type: string; content?: string }) =>
      s.type === "transcript" && s.content
  )
  return transcriptSource?.content ?? null
}
