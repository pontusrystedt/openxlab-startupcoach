import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const { title, url } = await req.json()

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
      uploadedBy: session.user.id,
    },
  })

  return NextResponse.json(record)
}
