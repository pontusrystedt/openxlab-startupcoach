import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"

export default async function StartupsPage() {
  await requireCoach()

  const startups = await prisma.startup.findMany({
    include: { _count: { select: { sessions: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Startups</h1>
        <Link
          href="/coaching/new"
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
        >
          + Ny startup
        </Link>
      </div>
      <div className="grid gap-3">
        {startups.map((startup) => (
          <Link
            key={startup.id}
            href={`/coaching/${startup.id}`}
            className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:border-[#1D9E75] transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">{startup.name}</p>
              <p className="text-sm text-gray-500">{startup.sector}</p>
            </div>
            <span className="text-sm text-gray-400">
              {startup._count.sessions} sessions
            </span>
          </Link>
        ))}
        {startups.length === 0 && (
          <p className="text-center py-12 text-gray-400">Inga startups ännu</p>
        )}
      </div>
    </div>
  )
}
