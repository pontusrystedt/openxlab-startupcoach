import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireCoach()

  const projects = await prisma.funderProject.findMany({
    where: { orgId: session.user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { startups: { include: { startup: { select: { id: true, name: true } } } } },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const { name, funderName, periodStart, periodEnd, requirementText } = await req.json()

  const project = await prisma.funderProject.create({
    data: {
      name,
      funderName,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      requirementText: requirementText ?? null,
      orgId: session.user.orgId!,
    },
  })

  return NextResponse.json(project)
}
