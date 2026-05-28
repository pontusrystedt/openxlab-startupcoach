import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params

  const todos = await prisma.projectTodo.findMany({
    where: { projectId: id },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(todos)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params
  const { text, dueDate, meetingId } = await req.json()

  if (!text?.trim()) return NextResponse.json({ error: "Text krävs" }, { status: 400 })

  const count = await prisma.projectTodo.count({ where: { projectId: id } })

  const todo = await prisma.projectTodo.create({
    data: {
      projectId: id,
      text: text.trim(),
      priority: count,
      dueDate: dueDate ? new Date(dueDate) : null,
      meetingId: meetingId ?? null,
    },
  })

  return NextResponse.json(todo)
}
