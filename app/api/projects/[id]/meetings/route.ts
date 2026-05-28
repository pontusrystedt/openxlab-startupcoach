import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params

  const meetings = await prisma.projectMeeting.findMany({
    where: { projectId: id },
    include: { todos: { orderBy: { priority: "asc" } } },
    orderBy: { meetingNumber: "desc" },
  })

  return NextResponse.json(meetings)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params
  const { scheduledAt } = await req.json()

  const count = await prisma.projectMeeting.count({ where: { projectId: id } })

  const meeting = await prisma.projectMeeting.create({
    data: {
      projectId: id,
      meetingNumber: count + 1,
      scheduledAt: new Date(scheduledAt),
    },
    include: { todos: true },
  })

  return NextResponse.json(meeting)
}
