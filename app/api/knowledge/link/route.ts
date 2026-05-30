import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const { title, url, collections: collectionsRaw } = await req.json()
  const collections = Array.isArray(collectionsRaw) && collectionsRaw.length > 0
    ? collectionsRaw as string[]
    : ["general"]

  if (!title || !url) {
    return NextResponse.json({ error: "Titel och URL krävs" }, { status: 400 })
  }

  const record = await prisma.knowledgeItem.create({
    data: {
      orgId: session.user.orgId!,
      type: "LINK",
      title,
      url,
      keywords: [],
      collections,
      uploadedBy: session.user.id,
    },
  })

  return NextResponse.json(record)
}
