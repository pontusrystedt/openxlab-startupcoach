import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireClientAdmin()
  const { id } = await params

  const project = await prisma.funderProject.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.startupFunderProject.deleteMany({ where: { projectId: id } })
  await prisma.funderProject.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireClientAdmin()
  const { id } = await params

  const project = await prisma.funderProject.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, funderName, periodStart, periodEnd, requirementText } = await req.json()

  const updated = await prisma.funderProject.update({
    where: { id },
    data: {
      name,
      funderName,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      requirementText: requirementText ?? undefined,
    },
  })

  return NextResponse.json(updated)
}
