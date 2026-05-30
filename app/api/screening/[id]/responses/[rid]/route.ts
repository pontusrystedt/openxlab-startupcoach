import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string }> }
) {
  const session = await requireCoach()
  const { id, rid } = await params

  const response = await prisma.screeningResponse.findUnique({
    where: { id: rid },
    include: { startup: { select: { orgId: true } } },
  })

  if (!response || response.startupId !== id) {
    return NextResponse.json({ error: "Svar hittades inte" }, { status: 404 })
  }

  if (response.startup.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 })
  }

  const { coachEdit } = await req.json()

  const updated = await prisma.screeningResponse.update({
    where: { id: rid },
    data: { coachEdit },
  })

  return NextResponse.json(updated)
}
