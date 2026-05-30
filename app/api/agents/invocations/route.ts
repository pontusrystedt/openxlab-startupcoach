import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await requireCoach()
  const { searchParams } = new URL(req.url)
  const startupId = searchParams.get("startupId")
  const sessionId = searchParams.get("sessionId")

  const where: Record<string, unknown> = { orgId: session.user.orgId }
  if (startupId) where.startupId = startupId
  if (sessionId) where.sessionId = sessionId

  const invocations = await prisma.agentInvocation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(invocations)
}
