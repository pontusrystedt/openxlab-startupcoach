import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { getUserKlangKey, fetchKlangTranscript } from "@/lib/klang"
import { runDecisionsAgent } from "@/lib/agents/decisions-agent"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const session = await requireCoach()
  const { meetingId } = await params

  const { klangFileId } = await req.json()
  if (!klangFileId) {
    return NextResponse.json({ error: "klangFileId krävs" }, { status: 400 })
  }

  const meeting = await prisma.coachMeeting.findUnique({
    where: { id: meetingId },
    select: { orgId: true },
  })

  if (!meeting || meeting.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Möte hittades inte" }, { status: 404 })
  }

  // Spara kopplingen
  await prisma.coachMeeting.update({
    where: { id: meetingId },
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
      await prisma.coachMeeting.update({
        where: { id: meetingId },
        data: {
          encryptedTranscript: encryptedText,
          transcriptIv: iv,
          transcriptAuthTag: authTag,
        },
      })

      // Kör agenten asynkront
      runDecisionsAgent(meetingId).catch((err) =>
        console.error("Decisions agent misslyckades:", err)
      )

      return NextResponse.json({ klangFileId, transcriptFetched: true })
    }
  }

  return NextResponse.json({ klangFileId, transcriptFetched: false })
}
