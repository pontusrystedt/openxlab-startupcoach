import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/storage"
import { extractText } from "@/lib/extract-text"
import { generateKeywords } from "@/lib/agents/keyword-agent"

export async function POST(req: NextRequest) {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const title = (formData.get("title") as string | null) ?? file?.name ?? "Namnlös fil"
  const collectionsRaw = formData.get("collections") as string | null
  const collections = collectionsRaw
    ? (JSON.parse(collectionsRaw) as string[])
    : ["general"]

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 20 MB" }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { storageKey } = await uploadFile(
    buffer,
    file.type,
    `knowledge/${session.user.orgId}`
  )

  const extractedText = await extractText(buffer, file.type)
  const keywords = extractedText
    ? await generateKeywords(title, extractedText)
    : []

  const record = await prisma.knowledgeItem.create({
    data: {
      orgId: session.user.orgId!,
      type: "FILE",
      title,
      fileName: file.name,
      mimeType: file.type,
      storageKey,
      keywords,
      collections,
      extractedText: extractedText || null,
      uploadedBy: session.user.id,
    },
  })

  return NextResponse.json(record)
}
