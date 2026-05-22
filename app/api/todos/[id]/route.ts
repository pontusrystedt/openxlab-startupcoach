import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEntrepreneur } from "@/lib/access"
import { auth } from "@/auth"

export async function PATCH(
  _req: NextRequest,
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

  const updated = await prisma.todo.update({
    where: { id },
    data: { completedAt: todo.completedAt ? null : new Date() },
  })

  return NextResponse.json(updated)
}
