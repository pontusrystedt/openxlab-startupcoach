import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireCoach()

  const { klangFileId } = await req.json()
  if (!klangFileId) {
    return NextResponse.json({ error: "klangFileId krävs" }, { status: 400 })
  }

  const transcript = await prisma.transcript.upsert({
    where: { sessionId: id },
    create: {
      sessionId: id,
      klangFileId,
      encryptedText: "",
      iv: "",
      authTag: "",
    },
    update: { klangFileId },
  })

  return NextResponse.json(transcript)
}
