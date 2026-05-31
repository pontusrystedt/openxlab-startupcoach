import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { extractText } from "@/lib/extract-text"
import { suggestCollections } from "@/lib/agents/keyword-agent"

export async function POST(req: NextRequest) {
  const session = await requireCoach()

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const extractedText = await extractText(buffer, file.type)

  const availableCollections = await prisma.knowledgeCollection.findMany({
    where: {
      OR: [{ isGlobal: true }, { orgId: session.user.orgId }],
    },
    select: { slug: true, name: true, description: true },
  })

  const suggested = extractedText
    ? await suggestCollections(file.name, extractedText, availableCollections)
    : ["general"]

  return NextResponse.json({ suggested, availableCollections })
}
