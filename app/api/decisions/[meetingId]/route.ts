import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const session = await requireCoach()
  const { meetingId } = await params

  const meeting = await prisma.coachMeeting.findUnique({
    where: { id: meetingId },
    include: {
      decisions: {
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        include: {
          startup: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!meeting || meeting.orgId !== session.user.orgId) {
    notFound()
  }

  return NextResponse.json(meeting)
}
