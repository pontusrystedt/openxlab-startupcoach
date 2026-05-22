import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { runPostMeetingAgent } from "@/lib/agents/post-meeting"

// Undantagen från auth-proxy (se proxy.ts matcher)
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-klang-webhook-secret")
  if (secret !== process.env.KLANG_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // TODO: Verifiera exakt payload-struktur mot Klang.ai docs
  // Antagen struktur: { type: string, fileId: string, transcriptionText: string }
  if (body.type !== "transcriptionFinished") {
    return NextResponse.json({ ok: true })
  }

  const { fileId, transcriptionText } = body

  const transcript = await prisma.transcript.findUnique({
    where: { klangFileId: fileId },
    include: { session: { include: { startup: true } } },
  })

  if (!transcript) {
    console.warn(`Ingen session hittad för Klang.ai fileId: ${fileId}`)
    return NextResponse.json({ ok: true })
  }

  const { encryptedText, iv, authTag } = encrypt(transcriptionText)
  await prisma.transcript.update({
    where: { id: transcript.id },
    data: { encryptedText, iv, authTag },
  })

  runPostMeetingAgent(transcript.sessionId).catch((err) =>
    console.error("Post-meeting agent misslyckades:", err)
  )

  return NextResponse.json({ ok: true })
}
