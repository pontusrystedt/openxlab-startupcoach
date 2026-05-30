import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    select: { orgId: true },
  })

  if (!startup || startup.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Startup hittades inte" }, { status: 404 })
  }

  const events = await prisma.alumniEvent.findMany({
    where: { startupId: id },
    orderBy: { eventDate: "desc" },
  })

  return NextResponse.json(events)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    select: { orgId: true, status: true },
  })

  if (!startup || startup.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Startup hittades inte" }, { status: 404 })
  }

  if (startup.status !== "ALUMNI") {
    return NextResponse.json(
      { error: "Startup är inte alumni" },
      { status: 400 }
    )
  }

  const { type, title, description, eventDate, klangFileId } = await req.json()

  const validTypes = ["MEETING", "PRESENTATION", "NOTE", "MILESTONE"]
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json({ error: "Ogiltig event-typ" }, { status: 400 })
  }

  if (!title || !eventDate) {
    return NextResponse.json(
      { error: "title och eventDate krävs" },
      { status: 400 }
    )
  }

  const event = await prisma.alumniEvent.create({
    data: {
      startupId: id,
      type,
      title,
      description: description ?? null,
      eventDate: new Date(eventDate),
      klangFileId: klangFileId ?? null,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
