import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { archiveOldDecisions } from "@/lib/decisions-archiver"

export async function GET(req: NextRequest) {
  const session = await requireCoach()
  const orgId = session.user.orgId

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter")
  const startupId = searchParams.get("startup")

  // Arkivera gamla beslut automatiskt
  await archiveOldDecisions(orgId)

  if (filter === "active") {
    // Returnera alla aktiva beslut (ej arkiverade) för org
    const decisions = await prisma.decision.findMany({
      where: {
        orgId,
        status: { not: "ARCHIVED" },
        ...(startupId ? { startupId } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        startup: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true, meetingDate: true } },
      },
    })
    return NextResponse.json(decisions)
  }

  if (filter === "archived") {
    const decisions = await prisma.decision.findMany({
      where: {
        orgId,
        status: "ARCHIVED",
        ...(startupId ? { startupId } : {}),
      },
      orderBy: [{ archivedAt: "desc" }],
      include: {
        startup: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true, meetingDate: true } },
      },
    })
    return NextResponse.json(decisions)
  }

  // Default: Lista coachmöten med besluts-count
  const meetings = await prisma.coachMeeting.findMany({
    where: { orgId },
    orderBy: { meetingDate: "desc" },
    include: {
      _count: { select: { decisions: true } },
      decisions: {
        where: { status: { not: "ARCHIVED" } },
        select: { id: true },
      },
    },
  })

  return NextResponse.json(
    meetings.map((m) => ({
      id: m.id,
      title: m.title,
      meetingDate: m.meetingDate,
      klangFileId: m.klangFileId,
      agentRan: m.agentRan,
      totalDecisions: m._count.decisions,
      activeDecisions: m.decisions.length,
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await requireCoach()
  const orgId = session.user.orgId

  const { title, meetingDate } = await req.json()

  if (!title || !meetingDate) {
    return NextResponse.json(
      { error: "title och meetingDate krävs" },
      { status: 400 }
    )
  }

  const meeting = await prisma.coachMeeting.create({
    data: {
      title,
      meetingDate: new Date(meetingDate),
      orgId,
    },
  })

  return NextResponse.json(meeting, { status: 201 })
}
