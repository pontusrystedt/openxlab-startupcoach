import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await requireCoach()
  const { id, eventId } = await params

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

  const { title, description } = await req.json()

  const updated = await prisma.alumniEvent.update({
    where: { id: eventId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  })

  return NextResponse.json(updated)
}
