import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
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

  const { screeningOutcome } = await req.json()

  const validOutcomes = ["PENDING", "APPROVED", "REJECTED"]
  if (!validOutcomes.includes(screeningOutcome)) {
    return NextResponse.json({ error: "Ogiltigt outcome" }, { status: 400 })
  }

  const updated = await prisma.startup.update({
    where: { id },
    data: { screeningOutcome },
  })

  return NextResponse.json(updated)
}
