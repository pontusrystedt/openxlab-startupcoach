import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/storage"
import { extractText } from "@/lib/extract-text"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id: programId } = await params

  const program = await prisma.program.findFirst({
    where: { id: programId, orgId: session.user.orgId! },
  })
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { storageKey } = await uploadFile(
    buffer,
    file.type,
    `programs/${programId}`
  )

  const extractedText = await extractText(buffer, file.type)

  await prisma.programQuestionDoc.upsert({
    where: { programId },
    create: {
      programId,
      fileName: file.name,
      storageKey,
      extractedText: extractedText || "",
      uploadedBy: session.user.id,
    },
    update: {
      fileName: file.name,
      storageKey,
      extractedText: extractedText || "",
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
