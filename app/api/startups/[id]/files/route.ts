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
  const { id: startupId } = await params

  const startup = await prisma.startup.findFirst({
    where: { id: startupId, orgId: session.user.orgId! },
  })
  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const files = await prisma.startupFile.findMany({
    where: { startupId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
      description: true,
    },
  })

  return NextResponse.json(files)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id: startupId } = await params

  const startup = await prisma.startup.findFirst({
    where: { id: startupId, orgId: session.user.orgId! },
  })
  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const description = formData.get("description") as string | null

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 20 MB" }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { storageKey, sizeBytes } = await uploadFile(
    buffer,
    file.type,
    `startups/${startupId}`
  )

  const extractedText = await extractText(buffer, file.type) || null

  const record = await prisma.startupFile.create({
    data: {
      startupId,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes,
      storageKey,
      uploadedBy: session.user.id,
      description: description ?? undefined,
      extractedText,
    },
  })

  return NextResponse.json(record)
}
