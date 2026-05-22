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

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, email: true, role: true } },
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "asc" } },
      sessions: {
        orderBy: { sessionNumber: "asc" },
        include: {
          transcript: true,
          summary: true,
          todos: { include: { feedback: true } },
        },
      },
    },
  })

  if (!startup) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })

  // Dekryptera transkriptioner och summor server-side
  const exportData = {
    ...startup,
    sessions: startup.sessions.map((session) => ({
      ...session,
      transcript: session.transcript
        ? {
            id: session.transcript.id,
            klangFileId: session.transcript.klangFileId,
            durationSeconds: session.transcript.durationSeconds,
            createdAt: session.transcript.createdAt,
            text:
              session.transcript.encryptedText
                ? decrypt(
                    session.transcript.encryptedText,
                    session.transcript.iv,
                    session.transcript.authTag
                  )
                : null,
          }
        : null,
      summary: session.summary
        ? (() => {
            const data = JSON.parse(
              decrypt(
                session.summary.encryptedData,
                session.summary.iv,
                session.summary.authTag
              )
            )
            return { id: session.summary.id, createdAt: session.summary.createdAt, ...data }
          })()
        : null,
    })),
  }

  return NextResponse.json(exportData)
}
