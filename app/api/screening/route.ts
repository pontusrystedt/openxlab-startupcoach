import { NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireCoach()

  const startups = await prisma.startup.findMany({
    where: {
      status: "SCREENING",
      ...(session.user.orgId ? { orgId: session.user.orgId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      sector: true,
      status: true,
      contactEmail: true,
      contactPhone: true,
      businessIdea: true,
      createdAt: true,
      _count: { select: { sessions: true } },
      program: {
        select: {
          id: true,
          name: true,
          questionDoc: {
            select: {
              extractedText: true,
              fileName: true,
            },
          },
        },
      },
    },
  })

  return NextResponse.json(startups)
}
