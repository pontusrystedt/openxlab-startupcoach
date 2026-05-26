import { NextRequest, NextResponse } from "next/server"
import { requireCoach, requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireCoach()

  const programs = await prisma.program.findMany({
    where: { orgId: session.user.orgId! },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(programs)
}

export async function POST(req: NextRequest) {
  const session = await requireClientAdmin()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const { name, description } = await req.json()

  const program = await prisma.program.create({
    data: { name, description, orgId: session.user.orgId! },
  })

  return NextResponse.json(program)
}
