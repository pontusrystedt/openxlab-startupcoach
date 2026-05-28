import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  await requireCoach()
  const { mid } = await params

  await prisma.projectTodo.deleteMany({ where: { meetingId: mid } })
  await prisma.projectMeeting.delete({ where: { id: mid } })

  return NextResponse.json({ ok: true })
}
