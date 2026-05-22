import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEntrepreneur } from "@/lib/access"
import { auth } from "@/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userSession = await auth()
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await prisma.session.findUnique({
    where: { id },
    select: { startupId: true },
  })

  if (!session) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })
  await requireEntrepreneur(session.startupId)

  const todos = await prisma.todo.findMany({
    where: { sessionId: id },
    orderBy: { priority: "asc" },
    include: { feedback: true },
  })

  return NextResponse.json(todos)
}
