import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach, requireEntrepreneur } from "@/lib/access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireEntrepreneur(id)

  const profiles = await prisma.irlProfile.findMany({
    where: { startupId: id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(profiles)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireCoach()

  const { crl, trl, brl, iprl, frl, orl, notes } = await req.json()

  const scores = [crl, trl, brl, iprl, frl, orl]
  if (scores.some((s) => typeof s !== "number" || s < 1 || s > 9)) {
    return NextResponse.json(
      { error: "Alla IRL-värden måste vara heltal 1–9" },
      { status: 400 }
    )
  }

  const profile = await prisma.irlProfile.create({
    data: { startupId: id, crl, trl, brl, iprl, frl, orl, notes },
  })

  return NextResponse.json(profile, { status: 201 })
}
