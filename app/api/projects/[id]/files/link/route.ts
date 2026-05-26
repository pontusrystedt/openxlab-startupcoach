import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id: projectId } = await params

  const project = await prisma.funderProject.findFirst({
    where: { id: projectId, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { title, url } = await req.json()
  if (!title || !url) {
    return NextResponse.json({ error: "Titel och URL krävs" }, { status: 400 })
  }

  const record = await prisma.funderProjectFile.create({
    data: { projectId, type: "LINK", title, url, uploadedBy: session.user.id },
  })

  return NextResponse.json(record)
}
