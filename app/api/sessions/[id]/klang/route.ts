import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import { encrypt, decrypt } from "@/lib/crypto"
import { runPostMeetingAgent } from "@/lib/agents/post-meeting"

async function fetchKlangTranscript(conversationId: string, apiKey: string): Promise<string | null> {
  const res = await fetch(
    `https://app.klang.ai/api/v1/conversations/${conversationId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const source = data.sources?.find(
    (s: { type: string; content?: string }) => s.type === "transcript" && s.content
  )
  return source?.content ?? null
}

async function getUserKlangKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { klangApiKey: true },
  })
  if (!user?.klangApiKey) return null
  try {
    const stored = JSON.parse(user.klangApiKey) as { encryptedText: string; iv: string; authTag: string }
    return decrypt(stored.encryptedText, stored.iv, stored.authTag)
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  const { klangFileId } = await req.json()
  if (!klangFileId) {
    return NextResponse.json({ error: "klangFileId krävs" }, { status: 400 })
  }

  // Spara kopplingen
  await prisma.transcript.upsert({
    where: { sessionId: id },
    create: { sessionId: id, klangFileId, encryptedText: "", iv: "", authTag: "" },
    update: { klangFileId },
  })

  // Försök hämta transkriptet direkt — mötet kan redan vara klart
  const apiKey =
    (await getUserKlangKey(session.user.id)) ??
    process.env.KLANG_API_KEY ??
    null

  if (apiKey) {
    const transcriptText = await fetchKlangTranscript(klangFileId, apiKey)

    if (transcriptText) {
      const { encryptedText, iv, authTag } = encrypt(transcriptText)
      await prisma.transcript.update({
        where: { sessionId: id },
        data: { encryptedText, iv, authTag },
      })

      // Kör agenten asynkront
      runPostMeetingAgent(id).catch((err) =>
        console.error("Post-meeting agent misslyckades:", err)
      )

      return NextResponse.json({ klangFileId, transcriptFetched: true })
    }
  }

  return NextResponse.json({ klangFileId, transcriptFetched: false })
}
