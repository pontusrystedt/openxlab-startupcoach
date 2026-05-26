import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id: projectId } = await params
  const { startupId } = await req.json()

  const project = await prisma.funderProject.findFirst({
    where: { id: projectId, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const record = await prisma.startupFunderProject.create({
    data: { startupId, projectId },
  })

  return NextResponse.json(record)
}
