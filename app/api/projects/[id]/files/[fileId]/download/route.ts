import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { getDownloadUrl } from "@/lib/storage"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await requireCoach()
  const { id: projectId, fileId } = await params

  const project = await prisma.funderProject.findFirst({
    where: { id: projectId, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const file = await prisma.funderProjectFile.findFirst({
    where: { id: fileId, projectId },
  })
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!file.storageKey) return NextResponse.json({ error: "Ingen fil att ladda ner" }, { status: 400 })

  const url = await getDownloadUrl(file.storageKey)
  return NextResponse.json({ url })
}
