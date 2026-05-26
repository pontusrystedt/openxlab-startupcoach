import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

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

  const { title, url } = await req.json()
  if (!title || !url) {
    return NextResponse.json({ error: "Titel och URL krävs" }, { status: 400 })
  }

  const record = await prisma.startupFile.create({
    data: {
      startupId,
      type: "LINK",
      title,
      url,
      uploadedBy: session.user.id,
    },
  })

  return NextResponse.json(record)
}
