import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params
  const { stars, feedback } = await req.json()

  const invocation = await prisma.agentInvocation.findFirst({
    where: { id, orgId: session.user.orgId },
  })
  if (!invocation) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 })
  }

  const updated = await prisma.agentInvocation.update({
    where: { id },
    data: {
      coachStars: typeof stars === "number" ? stars : undefined,
      coachFeedback: typeof feedback === "string" ? feedback : undefined,
    },
  })

  return NextResponse.json(updated)
}
