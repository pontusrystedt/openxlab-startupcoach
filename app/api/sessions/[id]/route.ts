import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { requireEntrepreneur } from "@/lib/access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userSession = await auth()
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      startup: true,
      summary: true,
      todos: { orderBy: { priority: "asc" }, include: { feedback: true } },
    },
  })

  if (!session) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })

  await requireEntrepreneur(session.startupId)

  return NextResponse.json(session)
}
