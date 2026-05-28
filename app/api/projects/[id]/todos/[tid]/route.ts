import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tid: string }> }
) {
  await requireCoach()
  const { tid } = await params
  const data = await req.json()

  const todo = await prisma.projectTodo.update({
    where: { id: tid },
    data,
  })

  return NextResponse.json(todo)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tid: string }> }
) {
  await requireCoach()
  const { tid } = await params

  await prisma.projectTodo.delete({ where: { id: tid } })

  return NextResponse.json({ ok: true })
}
