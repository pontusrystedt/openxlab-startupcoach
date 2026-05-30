import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  const body = await req.json()
  const { text, status, comment, priority } = body

  const decision = await prisma.decision.findUnique({
    where: { id },
    select: { orgId: true },
  })

  if (!decision || decision.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Beslut hittades inte" }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (text !== undefined) updateData.text = text
  if (comment !== undefined) updateData.comment = comment
  if (priority !== undefined) updateData.priority = priority
  if (status !== undefined) {
    updateData.status = status
    if (status === "ARCHIVED") {
      updateData.archivedAt = new Date()
    } else {
      updateData.archivedAt = null
    }
  }

  const updated = await prisma.decision.update({
    where: { id },
    data: updateData,
    include: {
      startup: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}
