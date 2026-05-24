import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id: startupId } = await params
  const { firstName, lastName, email, phone } = await req.json()

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Förnamn, efternamn och e-post krävs" }, { status: 400 })
  }

  const member = await prisma.teamMember.create({
    data: { startupId, firstName, lastName, email, phone: phone || null },
  })

  return NextResponse.json(member)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id: startupId } = await params
  const { memberId } = await req.json()

  await prisma.teamMember.deleteMany({
    where: { id: memberId, startupId },
  })

  return NextResponse.json({ ok: true })
}
