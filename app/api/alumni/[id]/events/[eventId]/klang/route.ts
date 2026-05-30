import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { getUserKlangKey, fetchKlangTranscript } from "@/lib/klang"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await requireCoach()
  const { id, eventId } = await params

  const { klangFileId } = await req.json()
  if (!klangFileId) {
    return NextResponse.json({ error: "klangFileId krävs" }, { status: 400 })
  }

  const event = await prisma.alumniEvent.findUnique({
    where: { id: eventId },
    include: { startup: { select: { orgId: true } } },
  })

  if (!event || event.startupId !== id) {
    return NextResponse.json({ error: "Event hittades inte" }, { status: 404 })
  }

  if (event.startup.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 })
  }

  // Spara kopplingen
  await prisma.alumniEvent.update({
    where: { id: eventId },
    data: { klangFileId },
  })

  // Försök hämta transkriptet direkt
  const apiKey =
    (await getUserKlangKey(session.user.id)) ??
    process.env.KLANG_API_KEY ??
    null

  if (apiKey) {
    const transcriptText = await fetchKlangTranscript(klangFileId, apiKey)

    if (transcriptText) {
      const { encryptedText, iv, authTag } = encrypt(transcriptText)
      await prisma.alumniEvent.update({
        where: { id: eventId },
        data: {
          encryptedTranscript: encryptedText,
          transcriptIv: iv,
          transcriptAuthTag: authTag,
        },
      })

      return NextResponse.json({ klangFileId, transcriptFetched: true })
    }
  }

  return NextResponse.json({ klangFileId, transcriptFetched: false })
}
