import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEntrepreneur } from "@/lib/access"
import { auth } from "@/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userSession = await auth()
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { session: { select: { startupId: true } } },
  })

  if (!todo) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })
  await requireEntrepreneur(todo.session.startupId)

  const { stars, comment } = await req.json()
  if (stars !== undefined && (stars < 1 || stars > 5)) {
    return NextResponse.json({ error: "stars måste vara 1–5" }, { status: 400 })
  }

  const feedback = await prisma.todoFeedback.upsert({
    where: { todoId: id },
    create: { todoId: id, stars, comment },
    update: { stars, comment },
  })

  return NextResponse.json(feedback)
}
