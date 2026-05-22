import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import { decrypt } from "@/lib/crypto"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireCoach()

  const transcript = await prisma.transcript.findUnique({
    where: { sessionId: id },
  })

  if (!transcript) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })
  if (!transcript.encryptedText) {
    return NextResponse.json({ text: null, status: "pending" })
  }

  const text = decrypt(transcript.encryptedText, transcript.iv, transcript.authTag)

  return NextResponse.json({
    id: transcript.id,
    klangFileId: transcript.klangFileId,
    durationSeconds: transcript.durationSeconds,
    createdAt: transcript.createdAt,
    text,
  })
}
