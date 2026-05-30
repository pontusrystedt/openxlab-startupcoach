import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
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

  const updated = await prisma.startup.update({
    where: { id },
    data: {
      screeningOutcome: "APPROVED",
      status: "COACHING",
    },
  })

  return NextResponse.json(updated)
}
