import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"

export async function GET() {
  await requireCoach()

  const startups = await prisma.startup.findMany({
    include: {
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
      sessions: {
        orderBy: { scheduledAt: "desc" },
        take: 1,
        include: { _count: { select: { todos: true } } },
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { name: "asc" },
  })

  const stats = {
    totalStartups: startups.length,
    totalSessions: startups.reduce(
      (sum: number, s: (typeof startups)[0]) => sum + s._count.sessions,
      0
    ),
    fundingByStatus: startups.reduce(
      (acc: Record<string, number>, s: (typeof startups)[0]) => {
        if (s.fundingRound) {
          acc[s.fundingRound.status] = (acc[s.fundingRound.status] ?? 0) + 1
        }
        return acc
      },
      {}
    ),
  }

  return NextResponse.json({ startups, stats })
}
