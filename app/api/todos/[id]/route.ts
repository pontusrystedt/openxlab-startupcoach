import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userSession = await auth()
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Tillåtna fält att uppdatera
  const allowed = ["text", "comment", "status", "dueDate"]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  // Sätt completedAt automatiskt vid DONE
  if (data.status === "DONE") {
    data.completedAt = new Date()
  } else if (data.status && data.status !== "DONE") {
    data.completedAt = null
  }

  // RBAC: verifiera att entrepreneur bara redigerar sina egna todos
  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { session: { include: { startup: { include: { users: true } } } } },
  })

  if (!todo) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })

  if (userSession.user.role === "ENTREPRENEUR") {
    const belongsToUser = todo.session.startup.users.some(
      (u) => u.id === userSession.user.id
    )
    if (!belongsToUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.todo.update({ where: { id }, data })
  return NextResponse.json(updated)
}
