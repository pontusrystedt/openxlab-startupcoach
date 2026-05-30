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

  const { coachFeedback, coachStars } = await req.json()

  const analysis = await prisma.screeningAnalysis.update({
    where: { startupId: id },
    data: {
      ...(coachFeedback !== undefined ? { coachFeedback } : {}),
      ...(coachStars !== undefined ? { coachStars } : {}),
    },
  })

  return NextResponse.json(analysis)
}
