import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"

export default async function DashboardPage() {
  await requireCoach()

  const startups = await prisma.startup.findMany({
    include: {
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
      sessions: {
        orderBy: { scheduledAt: "desc" },
        take: 1,
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { name: "asc" },
  })

  const FUNDING_LABEL: Record<string, string> = {
    PLANNED: "Planerad",
    ACTIVE: "Aktiv",
    CLOSED: "Stängd",
    NOT_DEFINED: "–",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link
          href="/startups/new"
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
        >
          + Ny startup
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Startup</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sektor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sessions</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Senaste möte</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Investeringsrunda</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {startups.map((startup) => (
              <tr key={startup.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/startups/${startup.id}`}
                    className="font-medium text-[#1D9E75] hover:underline"
                  >
                    {startup.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{startup.sector}</td>
                <td className="px-4 py-3 text-gray-600">{startup._count.sessions}</td>
                <td className="px-4 py-3 text-gray-600">
                  {startup.sessions[0]
                    ? new Date(startup.sessions[0].scheduledAt).toLocaleDateString("sv-SE")
                    : "–"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {startup.fundingRound
                    ? `${startup.fundingRound.roundType ?? ""} ${startup.fundingRound.quarter}`
                    : "–"}
                </td>
                <td className="px-4 py-3">
                  {startup.fundingRound ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      {FUNDING_LABEL[startup.fundingRound.status]}
                    </span>
                  ) : (
                    <span className="text-gray-400">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {startups.length === 0 && (
          <p className="text-center py-12 text-gray-400">Inga startups ännu</p>
        )}
      </div>
    </div>
  )
}
