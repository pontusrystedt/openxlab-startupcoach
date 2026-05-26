import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

type StartupStatus = "SCREENING" | "COACHING" | "ALUMNI" | "ARCHIVED"

const ALLOWED: Record<StartupStatus, StartupStatus[]> = {
  SCREENING: ["COACHING", "ARCHIVED"],
  COACHING:  ["ALUMNI", "ARCHIVED"],
  ALUMNI:    ["COACHING"],
  ARCHIVED:  [],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params
  const { status: newStatus } = await req.json()

  const startup = await prisma.startup.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const current = startup.status as StartupStatus
  if (!ALLOWED[current].includes(newStatus)) {
    return NextResponse.json(
      { error: `Kan inte gå från ${current} till ${newStatus}` },
      { status: 400 }
    )
  }

  const updated = await prisma.startup.update({
    where: { id },
    data: { status: newStatus },
  })

  return NextResponse.json(updated)
}
