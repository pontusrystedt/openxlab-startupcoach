import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { getUserKlangKey, fetchKlangTranscript } from "@/lib/klang"
import { runScreeningAgent } from "@/lib/agents/screening-agent"

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

  const startup = await prisma.startup.findUnique({
    where: { id },
    select: { orgId: true, programId: true },
  })

  if (!startup || startup.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Startup hittades inte" }, { status: 404 })
  }

  // Spara kopplingen
  await prisma.startup.update({
    where: { id },
    data: { screeningMeetingId: klangFileId },
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
      await prisma.startup.update({
        where: { id },
        data: {
          screeningTranscriptEncrypted: encryptedText,
          screeningTranscriptIv: iv,
          screeningTranscriptAuthTag: authTag,
        },
      })

      // Kör screeningagenten asynkront
      runScreeningAgent(id, startup.programId ?? undefined).catch((err) =>
        console.error("Screening agent misslyckades:", err)
      )

      return NextResponse.json({ klangFileId, transcriptFetched: true })
    }
  }

  return NextResponse.json({ klangFileId, transcriptFetched: false })
}
