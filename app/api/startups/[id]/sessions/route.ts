import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach, requireEntrepreneur } from "@/lib/access"
import { auth } from "@/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireEntrepreneur(id)

  const sessions = await prisma.session.findMany({
    where: { startupId: id },
    include: {
      summary: true,
      _count: { select: { todos: true } },
    },
    orderBy: { scheduledAt: "desc" },
  })

  return NextResponse.json(sessions)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireCoach()

  const { sessionNumber: providedNumber, scheduledAt, phase } = await req.json()
  if (!scheduledAt) {
    return NextResponse.json({ error: "scheduledAt krävs" }, { status: 400 })
  }

  let sessionNumber = providedNumber
  if (!sessionNumber) {
    const last = await prisma.session.findFirst({
      where: { startupId: id },
      orderBy: { sessionNumber: "desc" },
      select: { sessionNumber: true },
    })
    sessionNumber = (last?.sessionNumber ?? 0) + 1
  }

  const session = await prisma.session.create({
    data: {
      startupId: id,
      sessionNumber,
      scheduledAt: new Date(scheduledAt),
      phase: phase ?? "COACHING",
    },
  })

  return NextResponse.json(session, { status: 201 })
}
