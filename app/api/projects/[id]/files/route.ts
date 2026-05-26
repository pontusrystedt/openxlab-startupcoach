import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/storage"
import { extractText } from "@/lib/extract-text"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id: projectId } = await params

  const project = await prisma.funderProject.findFirst({
    where: { id: projectId, orgId: session.user.orgId! },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const files = await prisma.funderProjectFile.findMany({
    where: { projectId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true, type: true, fileName: true, mimeType: true,
      sizeBytes: true, url: true, title: true, uploadedAt: true,
    },
  })

  return NextResponse.json(files)
}

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

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 20 MB" }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { storageKey, sizeBytes } = await uploadFile(
    buffer, file.type, `projects/${projectId}`
  )
  const extractedText = await extractText(buffer, file.type) || null

  const record = await prisma.funderProjectFile.create({
    data: {
      projectId,
      type: "FILE",
      fileName: file.name,
      mimeType: file.type,
      sizeBytes,
      storageKey,
      uploadedBy: session.user.id,
      extractedText,
    },
  })

  return NextResponse.json(record)
}
