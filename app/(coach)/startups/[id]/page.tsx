import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { IrlRadar } from "@/components/IrlRadar"
import { notFound } from "next/navigation"

export default async function StartupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      fundingRound: true,
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 2 },
      sessions: {
        orderBy: { sessionNumber: "desc" },
        include: { _count: { select: { todos: true } }, summary: true },
      },
    },
  })

  if (!startup) notFound()

  const [currentIrl, previousIrl] = startup.irlProfiles
  const PHASE_LABEL: Record<string, string> = {
    SOCIAL: "Social",
    IRL_CHECK: "IRL-check",
    COACHING: "Coaching",
    PRIORITIZATION: "Prioritering",
    CLOSING: "Avslutning",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{startup.name}</h1>
          <p className="text-gray-500">{startup.sector}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/startups/${id}/irl`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            IRL-historik
          </Link>
          <a
            href={`/api/startups/${id}/export`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Exportera data
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* IRL Radar */}
        <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">IRL-profil</h2>
            <Link
              href={`/startups/${id}/irl`}
              className="text-xs text-[#1D9E75] hover:underline"
            >
              Lägg till mätning
            </Link>
          </div>
          {currentIrl ? (
            <IrlRadar current={currentIrl} previous={previousIrl} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              Ingen IRL-profil ännu
            </p>
          )}
        </div>

        {/* Investeringsrunda */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Investeringsrunda
          </h2>
          {startup.fundingRound ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Kvartal</p>
                <p className="font-medium">{startup.fundingRound.quarter}</p>
              </div>
              <div>
                <p className="text-gray-500">Typ</p>
                <p className="font-medium">
                  {startup.fundingRound.roundType ?? "–"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Belopp (SEK)</p>
                <p className="font-medium">
                  {startup.fundingRound.amountSek
                    ? startup.fundingRound.amountSek.toLocaleString("sv-SE")
                    : "–"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium">{startup.fundingRound.status}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Ingen investeringsrunda registrerad</p>
          )}
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Möteslogg</h2>
          <Link
            href={`/startups/${id}/sessions`}
            className="text-sm text-[#1D9E75] hover:underline"
          >
            Alla sessions
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Datum</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Fas</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Todos</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {startup.sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/startups/${id}/sessions/${session.id}`}
                    className="text-[#1D9E75] hover:underline font-medium"
                  >
                    #{session.sessionNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(session.scheduledAt).toLocaleDateString("sv-SE")}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {PHASE_LABEL[session.phase]}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {session._count.todos}
                </td>
                <td className="px-4 py-3">
                  {session.summary ? (
                    <span className="text-green-600 text-xs">Klar</span>
                  ) : (
                    <span className="text-gray-400 text-xs">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {startup.sessions.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Inga sessions ännu</p>
        )}
      </div>
    </div>
  )
}
