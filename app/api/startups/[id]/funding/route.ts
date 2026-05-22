import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach, requireEntrepreneur } from "@/lib/access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireEntrepreneur(id)

  const funding = await prisma.fundingRound.findUnique({
    where: { startupId: id },
  })

  return NextResponse.json(funding)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireCoach()

  const { quarter, amountSek, roundType, status } = await req.json()

  const funding = await prisma.fundingRound.upsert({
    where: { startupId: id },
    create: { startupId: id, quarter, amountSek, roundType, status },
    update: { quarter, amountSek, roundType, status },
  })

  return NextResponse.json(funding)
}
