import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { runDecisionsAgent } from "@/lib/agents/decisions-agent"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const session = await requireCoach()
  const { meetingId } = await params

  const meeting = await prisma.coachMeeting.findUnique({
    where: { id: meetingId },
    select: { orgId: true, encryptedTranscript: true },
  })

  if (!meeting || meeting.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Möte hittades inte" }, { status: 404 })
  }

  if (!meeting.encryptedTranscript) {
    return NextResponse.json(
      { error: "Inget transkript kopplat till detta möte" },
      { status: 400 }
    )
  }

  // Kör agenten asynkront
  runDecisionsAgent(meetingId).catch((err) =>
    console.error("Decisions agent misslyckades:", err)
  )

  return NextResponse.json({ started: true })
}
