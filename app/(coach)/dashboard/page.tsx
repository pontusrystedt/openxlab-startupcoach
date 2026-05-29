import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { DashboardTable } from "./DashboardTable"

export default async function DashboardPage() {
  const session = await requireCoach()

  const startups = await prisma.startup.findMany({
    where: {
      ...(session.user.orgId ? { orgId: session.user.orgId } : {}),
      status: { not: "ARCHIVED" },
    },
    include: {
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
      sessions: { orderBy: { scheduledAt: "desc" }, take: 1 },
      _count: { select: { sessions: true } },
      program: { select: { name: true } },
      funderProjects: {
        include: { project: { select: { name: true, funderName: true } } },
      },
    },
    orderBy: { name: "asc" },
  })

  // Serialisera datum för klientkomponenten
  const serialized = startups.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    registeredAt: s.registeredAt?.toISOString() ?? null,
    sessions: s.sessions.map((sess) => ({
      scheduledAt: sess.scheduledAt.toISOString(),
    })),
    irlProfiles: s.irlProfiles,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link
          href="/coaching/new"
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
        >
          + Ny startup
        </Link>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <DashboardTable startups={serialized as any} />
    </div>
  )
}
