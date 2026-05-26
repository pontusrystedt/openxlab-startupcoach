import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const session = await requireCoach()
  const { id: projectId, sid: startupId } = await params

  const project = await prisma.funderProject.findFirst({
    where: { id: projectId, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.startupFunderProject.deleteMany({
    where: { projectId, startupId },
  })

  return NextResponse.json({ ok: true })
}
