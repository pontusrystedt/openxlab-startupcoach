import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  await requireCoach()
  const { mid } = await params
  const { klangFileId } = await req.json()

  if (!klangFileId) return NextResponse.json({ error: "klangFileId krävs" }, { status: 400 })

  const meeting = await prisma.projectMeeting.update({
    where: { id: mid },
    data: { klangFileId },
  })

  return NextResponse.json(meeting)
}
