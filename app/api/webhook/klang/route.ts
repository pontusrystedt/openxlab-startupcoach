import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { runPostMeetingAgent } from "@/lib/agents/post-meeting"

// Hämta transkripttext från Klang API
async function fetchKlangTranscript(conversationId: string): Promise<string | null> {
  const res = await fetch(
    `https://app.klang.ai/api/v1/conversations/${conversationId}`,
    { headers: { Authorization: `Bearer ${process.env.KLANG_API_KEY}` } }
  )
  if (!res.ok) {
    console.error(`Klang API svarade ${res.status} för konversation ${conversationId}`)
    return null
  }
  const data = await res.json()
  // Transkriptet ligger i sources[].content där type === "transcript"
  const transcriptSource = data.sources?.find(
    (s: { type: string; content?: string }) => s.type === "transcript" && s.content
  )
  return transcriptSource?.content ?? null
}

// Undantagen från auth-proxy (se proxy.ts matcher)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Logga alltid för felsökning
  console.log("Klang webhook body:", JSON.stringify(body, null, 2))

  // Verifiera webhook-secret — Klang kan skicka det i olika headers
  const secret =
    req.headers.get("x-klang-webhook-secret") ??
    req.headers.get("x-webhook-secret") ??
    req.headers.get("authorization")

  if (secret !== process.env.KLANG_WEBHOOK_SECRET) {
    console.warn("Webhook secret mismatch. Mottagen:", secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Stöd Klangs faktiska event-struktur: { event, data.id }
  // Fallback för simulerade anrop: { type, fileId }
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

  // Hitta kopplad session i vår databas
  const transcript = await prisma.transcript.findUnique({
    where: { klangFileId: conversationId },
    include: { session: { include: { startup: true } } },
  })

  if (!transcript) {
    console.warn(`Webhook: ingen session kopplad till klangFileId=${conversationId}`)
    return NextResponse.json({ ok: true, matched: false })
  }

  // Hämta transkripttext från Klang API
  const transcriptText = await fetchKlangTranscript(conversationId)
  if (!transcriptText) {
    console.error(`Webhook: kunde inte hämta transkript för ${conversationId}`)
    return NextResponse.json({ error: "Kunde inte hämta transkript" }, { status: 502 })
  }

  // Kryptera och spara
  const { encryptedText, iv, authTag } = encrypt(transcriptText)
  await prisma.transcript.update({
    where: { id: transcript.id },
    data: { encryptedText, iv, authTag },
  })

  // Kör post-mötes-agenten asynkront
  runPostMeetingAgent(transcript.sessionId).catch((err) =>
    console.error("Post-meeting agent misslyckades:", err)
  )

  return NextResponse.json({ ok: true, matched: true })
}
