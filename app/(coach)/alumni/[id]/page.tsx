import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { IrlRadar } from "@/components/IrlRadar"
import AlumniEventsSection from "./AlumniEventsSection"

export default async function AlumniDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 2 },
      program: { select: { name: true } },
      funderProjects: {
        include: { project: { select: { id: true, name: true, funderName: true } } },
      },
      sessions: {
        orderBy: { sessionNumber: "desc" },
        include: {
          _count: { select: { todos: true } },
        },
      },
      alumniEvents: {
        orderBy: { eventDate: "desc" },
      },
    },
  })

  if (!startup || startup.orgId !== session.user.orgId || startup.status !== "ALUMNI") {
    notFound()
  }

  const [currentIrl, previousIrl] = startup.irlProfiles

  const IRL_DIMS = ["crl", "trl", "brl", "iprl", "frl", "orl"]
  function avgIrl(profile: Record<string, unknown> | null) {
    if (!profile) return null
    const vals = IRL_DIMS.map((d) =>
      typeof profile[d] === "number" ? (profile[d] as number) : 0
    )
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  const irl = avgIrl(currentIrl as Record<string, unknown> | null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/alumni" className="text-sm text-gray-500 hover:text-gray-700">
            ← Alumni
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{startup.name}</h1>
          <p className="text-gray-500">{startup.sector}</p>
        </div>
        <Link
          href={`/coaching/${id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Startupprofil
        </Link>
      </div>

      {/* Grunddata */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kontakt</p>
            <div className="space-y-1">
              {startup.contactEmail ? (
                <a href={`mailto:${startup.contactEmail}`} className="text-[#1D9E75] hover:underline">
                  {startup.contactEmail}
                </a>
              ) : (
                <p className="text-gray-300">–</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Program</p>
            {startup.program ? (
              <p className="text-gray-600">{startup.program.name}</p>
            ) : (
              <p className="text-gray-300">–</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Coachmöten</p>
            <p className="text-gray-600">{startup.sessions.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">IRL-snitt</p>
            {irl ? (
              <p className="font-semibold text-[#1D9E75]">{irl}</p>
            ) : (
              <p className="text-gray-300">–</p>
            )}
          </div>
        </div>
      </div>

      {/* IRL */}
      {currentIrl && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 max-w-xs">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Avslutande IRL-profil</h2>
          <IrlRadar current={currentIrl} previous={previousIrl} />
        </div>
      )}

      {/* Coachinghistorik: sessions */}
      {startup.sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">Coachinghistorik</h2>
          <div className="space-y-1">
            {startup.sessions.map((s) => (
              <Link
                key={s.id}
                href={`/coaching/${id}/sessions/${s.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">
                  Session #{s.sessionNumber}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(s.scheduledAt).toLocaleDateString("sv-SE")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Alumni events */}
      <AlumniEventsSection
        startupId={id}
        events={startup.alumniEvents.map((e) => ({
          id: e.id,
          type: e.type,
          title: e.title,
          description: e.description,
          eventDate: e.eventDate.toISOString(),
          klangFileId: e.klangFileId,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
