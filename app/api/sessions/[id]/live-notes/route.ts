import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params
  const { liveNotes } = await req.json()

  const session = await prisma.session.update({
    where: { id },
    data: { liveNotes: typeof liveNotes === "string" ? liveNotes : null },
    select: { id: true, liveNotes: true },
  })

  return NextResponse.json(session)
}
