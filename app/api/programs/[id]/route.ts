import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params
  const { name, description, isActive } = await req.json()

  const program = await prisma.program.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.program.update({
    where: { id },
    data: { name, description, isActive },
  })

  return NextResponse.json(updated)
}
