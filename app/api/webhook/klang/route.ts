import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"
import { runPostMeetingAgent } from "@/lib/agents/post-meeting"
import { runPostMeetingProjectAgent } from "@/lib/agents/post-meeting-project"

// Hämta transkripttext från Klang API med given nyckel
async function fetchKlangTranscript(
  conversationId: string,
  apiKey: string
): Promise<string | null> {
  const res = await fetch(
    `https://app.klang.ai/api/v1/conversations/${conversationId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  if (!res.ok) {
    console.error(`Klang API svarade ${res.status} för konversation ${conversationId}`)
    return null
  }
  const data = await res.json()
  const transcriptSource = data.sources?.find(
    (s: { type: string; content?: string }) => s.type === "transcript" && s.content
  )
  return transcriptSource?.content ?? null
}

// Hämta API-nyckel för en användare (ur DB, krypterad)
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

// Undantagen från auth-proxy (se proxy.ts matcher)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log("Klang webhook body:", JSON.stringify(body, null, 2))

  // Kontrollera secret endast om KLANG_WEBHOOK_SECRET är satt OCH Klang faktiskt skickar den
  // Klang:s resthooks-API skickar inte secret-headers — kontrollen är valfri
  const configuredSecret = process.env.KLANG_WEBHOOK_SECRET
  if (configuredSecret) {
    const receivedSecret =
      req.headers.get("x-klang-webhook-secret") ??
      req.headers.get("x-webhook-secret") ??
      req.headers.get("authorization")
    if (receivedSecret && receivedSecret !== configuredSecret) {
      console.warn("Webhook secret mismatch. Mottagen:", receivedSecret)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const eventType = (body.event ?? body.type) as string
  const conversationId = (
    (body.data as Record<string, unknown>)?.id ?? body.fileId
  ) as string | undefined

  if (eventType !== "conversation.ready" && eventType !== "transcriptionFinished") {
    console.log("Webhook: ignorerar event-typ:", eventType)
    return NextResponse.json({ ok: true, skipped: true })
  }

  if (!conversationId) {
    console.error("Webhook: saknar konversations-ID i payload", body)
    return NextResponse.json({ error: "Missing conversation id" }, { status: 400 })
  }

  // ── 1. Kolla startup-session ───────────────────────────────────────────
  const transcript = await prisma.transcript.findUnique({
    where: { klangFileId: conversationId },
    include: { session: { include: { startup: true } } },
  })

  if (transcript) {
    const apiKey = process.env.KLANG_API_KEY
    if (!apiKey) {
      console.error("KLANG_API_KEY saknas för startup-session")
      return NextResponse.json({ error: "KLANG_API_KEY saknas" }, { status: 500 })
    }

    const transcriptText = await fetchKlangTranscript(conversationId, apiKey)
    if (!transcriptText) {
      return NextResponse.json({ error: "Kunde inte hämta transkript" }, { status: 502 })
    }

    const { encryptedText, iv, authTag } = encrypt(transcriptText)
    await prisma.transcript.update({
      where: { id: transcript.id },
      data: { encryptedText, iv, authTag },
    })

    runPostMeetingAgent(transcript.sessionId).catch((err) =>
      console.error("Post-meeting agent misslyckades:", err)
    )

    return NextResponse.json({ ok: true, matched: true, type: "session" })
  }

  // ── 2. Kolla projektmöte ──────────────────────────────────────────────
  const projectMeeting = await prisma.projectMeeting.findFirst({
    where: { klangFileId: conversationId },
  })

  if (projectMeeting) {
    // Använd den person som kopplade mötet, annars global nyckel
    let apiKey: string | null = null
    if (projectMeeting.linkedBy) {
      apiKey = await getUserKlangKey(projectMeeting.linkedBy)
    }
    if (!apiKey) apiKey = process.env.KLANG_API_KEY ?? null
    if (!apiKey) {
      console.error("Ingen Klang API-nyckel tillgänglig för projektmöte")
      return NextResponse.json({ error: "Ingen API-nyckel" }, { status: 500 })
    }

    const transcriptText = await fetchKlangTranscript(conversationId, apiKey)
    if (!transcriptText) {
      return NextResponse.json({ error: "Kunde inte hämta transkript" }, { status: 502 })
    }

    const { encryptedText, iv, authTag } = encrypt(transcriptText)
    await prisma.projectMeeting.update({
      where: { id: projectMeeting.id },
      data: {
        transcriptEncrypted: encryptedText,
        transcriptIv: iv,
        transcriptAuthTag: authTag,
      },
    })

    runPostMeetingProjectAgent(projectMeeting.id).catch((err) =>
      console.error("Post-meeting project agent misslyckades:", err)
    )

    return NextResponse.json({ ok: true, matched: true, type: "project" })
  }

  console.warn(`Webhook: ingen match för klangFileId=${conversationId}`)
  return NextResponse.json({ ok: true, matched: false })
}
