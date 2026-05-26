import { NextRequest, NextResponse } from "next/server"
import { requireCoach, requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 404 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
  })

  return NextResponse.json(org)
}

export async function PUT(req: NextRequest) {
  const session = await requireClientAdmin()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 404 })
  }

  const { name } = await req.json()

  const org = await prisma.organization.update({
    where: { id: session.user.orgId },
    data: { name },
  })

  return NextResponse.json(org)
}
