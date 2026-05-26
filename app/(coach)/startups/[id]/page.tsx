import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { IrlRadar } from "@/components/IrlRadar"
import { notFound } from "next/navigation"
import { StartupSections } from "./StartupSections"
import { StartupEditForm } from "./StartupEditForm"

export default async function StartupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireCoach()
  const { id } = await params

  const [startup, programs] = await Promise.all([
    prisma.startup.findUnique({
      where: { id },
      include: {
        fundingRound: true,
        irlProfiles: { orderBy: { createdAt: "desc" }, take: 2 },
        teamMembers: { orderBy: { createdAt: "asc" } },
        program: { select: { name: true } },
        funderProjects: {
          include: { project: { select: { id: true, name: true, funderName: true } } },
        },
        sessions: {
          orderBy: { sessionNumber: "desc" },
          include: {
            _count: { select: { todos: true } },
            summary: true,
            todos: {
              where: { status: { not: "DELETED" } },
              orderBy: { priority: "asc" },
            },
          },
        },
      },
    }),
    prisma.program.findMany({
      where: session.user.orgId ? { orgId: session.user.orgId, isActive: true } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!startup) notFound()

  const [currentIrl, previousIrl] = startup.irlProfiles

  // Samla alla todos från alla sessions, sorterade per session och prioritet
  const allTodos = startup.sessions.flatMap((s) =>
    s.todos.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      sessionNumber: s.sessionNumber,
    }))
  )

  const sessions = startup.sessions.map((s) => ({
    id: s.id,
    sessionNumber: s.sessionNumber,
    scheduledAt: s.scheduledAt.toISOString(),
    phase: s.phase,
    todoCount: s._count.todos,
    hasSummary: !!s.summary,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{startup.name}</h1>
          <p className="text-gray-500">{startup.sector}</p>
        </div>
        <div className="flex gap-2">
          <StartupEditForm startup={startup} programs={programs} />
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

      {/* Grunddata */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-4 gap-6 text-sm">
          {/* Kontakt */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kontakt</p>
            <div className="space-y-1">
              {startup.contactEmail ? (
                <p><a href={`mailto:${startup.contactEmail}`} className="text-[#1D9E75] hover:underline">{startup.contactEmail}</a></p>
              ) : <p className="text-gray-300">–</p>}
              {startup.contactPhone && <p className="text-gray-600">{startup.contactPhone}</p>}
              {startup.postAddress && <p className="text-gray-500 text-xs">{startup.postAddress}</p>}
            </div>
          </div>

          {/* Bolagsdata */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bolag</p>
            <div className="space-y-1">
              {startup.orgNumber && <p className="text-gray-600">Org.nr: {startup.orgNumber}</p>}
              {startup.registeredAt && (
                <p className="text-gray-600">Reg: {startup.registeredAt.toLocaleDateString("sv-SE")}</p>
              )}
              {startup.founderOwnershipPct != null && (
                <p className="text-gray-600">Grundare: {startup.founderOwnershipPct}%</p>
              )}
              {startup.activeOwnerPct != null && (
                <p className="text-gray-600">Aktiva ägare: {startup.activeOwnerPct}%</p>
              )}
              {!startup.orgNumber && !startup.registeredAt && <p className="text-gray-300">–</p>}
            </div>
          </div>

          {/* Program & Projekt */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Program & Projekt</p>
            <div className="space-y-1">
              {startup.program && (
                <p className="text-gray-600">📋 {startup.program.name}</p>
              )}
              {startup.funderProjects.length > 0 ? (
                startup.funderProjects.map(({ project }) => (
                  <p key={project.id} className="text-gray-600">💰 {project.funderName} – {project.name}</p>
                ))
              ) : !startup.program && <p className="text-gray-300">–</p>}
            </div>
          </div>

          {/* Affärsidé */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Affärsidé</p>
            {startup.businessIdea ? (
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-5">{startup.businessIdea}</p>
            ) : <p className="text-gray-300">–</p>}
          </div>
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
                <p className="font-medium">{startup.fundingRound.roundType ?? "–"}</p>
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

      {/* Fällbara sektioner: Team + Möten + Todos */}
      <StartupSections
        startupId={id}
        sessions={sessions}
        todos={allTodos}
        teamMembers={startup.teamMembers}
      />
    </div>
  )
}
