import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { IrlRadar } from "@/components/IrlRadar"
import { StartupSections } from "../../coaching/[id]/StartupSections"
import ScreeningTabs from "./ScreeningTabs"

export default async function ScreeningDetailPage({
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
        program: {
          include: {
            questionDoc: { select: { extractedText: true } },
          },
        },
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
        screeningResponses: {
          orderBy: { order: "asc" },
        },
        screeningAnalysis: true,
        files: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            fileName: true,
            title: true,
            type: true,
            mimeType: true,
            uploadedAt: true,
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

  if (!startup || startup.orgId !== session.user.orgId) {
    notFound()
  }

  const [currentIrl, previousIrl] = startup.irlProfiles

  // Serialisera sessions/todos för client component
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
          <Link href="/screening" className="text-sm text-gray-500 hover:text-gray-700">
            ← Screening
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{startup.name}</h1>
          <p className="text-gray-500">{startup.sector}</p>
        </div>
        <div className="flex gap-2 items-center">
          {startup.screeningOutcome !== "PENDING" && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                startup.screeningOutcome === "APPROVED"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {startup.screeningOutcome === "APPROVED" ? "Godkänd" : "Avvisad"}
            </span>
          )}
          <Link
            href={`/coaching/${id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Startupprofil
          </Link>
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
                <p>
                  <a href={`mailto:${startup.contactEmail}`} className="text-[#1D9E75] hover:underline">
                    {startup.contactEmail}
                  </a>
                </p>
              ) : (
                <p className="text-gray-300">–</p>
              )}
              {startup.contactPhone && <p className="text-gray-600">{startup.contactPhone}</p>}
            </div>
          </div>

          {/* Program */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Program</p>
            {startup.program ? (
              <p className="text-gray-600">{startup.program.name}</p>
            ) : (
              <p className="text-gray-300">–</p>
            )}
          </div>

          {/* Affärsidé */}
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Affärsidé</p>
            {startup.businessIdea ? (
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{startup.businessIdea}</p>
            ) : (
              <p className="text-gray-300">–</p>
            )}
          </div>
        </div>
      </div>

      {/* IRL om tillgängligt */}
      {currentIrl && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 max-w-xs">
          <h2 className="text-sm font-medium text-gray-700 mb-3">IRL-profil</h2>
          <IrlRadar current={currentIrl} previous={previousIrl} />
        </div>
      )}

      {/* Screening tabs */}
      <ScreeningTabs
        startupId={id}
        screeningOutcome={startup.screeningOutcome}
        responses={startup.screeningResponses.map((r) => ({
          id: r.id,
          question: r.question,
          aiAnswer: r.aiAnswer,
          coachEdit: r.coachEdit,
          order: r.order,
        }))}
        analysis={
          startup.screeningAnalysis
            ? {
                id: startup.screeningAnalysis.id,
                strengths: startup.screeningAnalysis.strengths,
                risks: startup.screeningAnalysis.risks,
                recommendation: startup.screeningAnalysis.recommendation,
                reasoning: startup.screeningAnalysis.reasoning,
                coachFeedback: startup.screeningAnalysis.coachFeedback,
                coachStars: startup.screeningAnalysis.coachStars,
              }
            : null
        }
        klangFileId={startup.screeningMeetingId}
        programQuestions={startup.program?.questionDoc?.extractedText ?? null}
      />

      {/* Filer */}
      {startup.files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">Filer</h2>
          <div className="space-y-2">
            {startup.files.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{f.fileName ?? f.title ?? "Fil"}</span>
                <span className="text-xs text-gray-400">
                  {new Date(f.uploadedAt).toLocaleDateString("sv-SE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team & Sessions */}
      <StartupSections
        startupId={id}
        sessions={sessions}
        todos={allTodos}
        teamMembers={startup.teamMembers}
      />
    </div>
  )
}
