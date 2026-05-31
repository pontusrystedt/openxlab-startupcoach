import { NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET(_req?: Request) {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json([], { status: 200 })
  }

  const items = await prisma.knowledgeItem.findMany({
    where: { orgId: session.user.orgId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      url: true,
      fileName: true,
      mimeType: true,
      keywords: true,
      collections: true,
      uploadedBy: true,
      createdAt: true,
    },
  })

  return NextResponse.json(items)
}
