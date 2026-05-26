import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach, requireEntrepreneur } from "@/lib/access"
import { auth } from "@/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await requireEntrepreneur(id)

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
      sessions: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
        include: { _count: { select: { todos: true } } },
      },
    },
  })

  if (!startup) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })
  return NextResponse.json(startup)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requireCoach()

  const {
    name, sector, contactEmail, contactPhone, orgNumber,
    registeredAt, postAddress, preferredLanguage,
    founderOwnershipPct, activeOwnerPct, businessIdea,
    aiStatus, programId,
  } = await req.json()

  const startup = await prisma.startup.update({
    where: { id },
    data: {
      name,
      sector,
      contactEmail:       contactEmail       ?? null,
      contactPhone:       contactPhone       ?? null,
      orgNumber:          orgNumber          ?? null,
      registeredAt:       registeredAt       ? new Date(registeredAt) : null,
      postAddress:        postAddress        ?? null,
      preferredLanguage:  preferredLanguage  ?? undefined,
      founderOwnershipPct: founderOwnershipPct != null ? Number(founderOwnershipPct) : null,
      activeOwnerPct:     activeOwnerPct     != null ? Number(activeOwnerPct)     : null,
      businessIdea:       businessIdea       ?? null,
      aiStatus:           aiStatus           ?? undefined,
      programId:          programId          ?? null,
    },
  })
  return NextResponse.json(startup)
}
