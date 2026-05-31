import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import { DashboardTable } from "./DashboardTable"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await requireCoach()

  const upcomingSessions = session.user.orgId
    ? await prisma.session.findMany({
        where: {
          startup: { orgId: session.user.orgId },
          scheduledAt: { gte: new Date() },
          completedAt: null,
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: { startup: { select: { id: true, name: true } } },
      })
    : []

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Kommande möten */}
      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Kommande möten</h2>
          <div className="space-y-2">
            {upcomingSessions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-medium text-gray-900 text-sm">{s.startup.name}</span>
                  <span className="text-gray-400 text-sm mx-2">·</span>
                  <span className="text-gray-600 text-sm">Session #{s.sessionNumber}</span>
                  <span className="text-gray-400 text-sm mx-2">·</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(s.scheduledAt).toLocaleDateString("sv-SE", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.briefGeneratedAt ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Brief ✓
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Brief saknas
                    </span>
                  )}
                  <Link
                    href={`/coaching/${s.startup.id}/sessions/${s.id}/brief`}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    📋 Brief
                  </Link>
                  <Link
                    href={`/coaching/${s.startup.id}/sessions/${s.id}/live`}
                    className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    ▶ Live
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <DashboardTable startups={serialized as any} />
    </div>
  )
}
