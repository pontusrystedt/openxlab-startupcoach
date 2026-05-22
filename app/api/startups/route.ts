import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"

export async function GET() {
  await requireCoach()

  const startups = await prisma.startup.findMany({
    include: {
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(startups)
}

export async function POST(req: NextRequest) {
  await requireCoach()

  const { name, sector } = await req.json()
  if (!name || !sector) {
    return NextResponse.json({ error: "name och sector krävs" }, { status: 400 })
  }

  const startup = await prisma.startup.create({ data: { name, sector } })
  return NextResponse.json(startup, { status: 201 })
}
