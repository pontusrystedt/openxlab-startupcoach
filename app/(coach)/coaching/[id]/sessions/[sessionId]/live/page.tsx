import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { getAvailableAgents } from "@/lib/agents/agent-runner"
import { notFound } from "next/navigation"
import Link from "next/link"
import { AgentPanel } from "@/components/agents/AgentPanel"

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const session = await requireCoach()
  const { id, sessionId } = await params

  const [coachingSession, startup, availableAgents] = await Promise.all([
    prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        summary: true,
        todos: { orderBy: { priority: "asc" } },
      },
    }),
    prisma.startup.findUnique({ where: { id } }),
    getAvailableAgents(session.user.orgId),
  ])

  if (!coachingSession || !startup) notFound()

  // Filtrera: visa bara ON_DEMAND och DURING_MEETING-agenter i panelen
  const panelAgents = availableAgents.filter((a) =>
    ["ON_DEMAND", "DURING_MEETING"].includes(a.trigger)
  )

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* VÄNSTER: Sessioninfo och todos */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <Link
            href={`/coaching/${id}/sessions/${sessionId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Tillbaka
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">
            {startup.name} — Session #{coachingSession.sessionNumber}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(coachingSession.scheduledAt).toLocaleDateString("sv-SE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {coachingSession.todos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-medium text-gray-900 mb-3">Öppna todos</h2>
            <ol className="space-y-2">
              {coachingSession.todos.map((todo) => (
                <li key={todo.id} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1D9E75] text-white text-xs flex items-center justify-center mt-0.5">
                    {todo.priority}
                  </span>
                  <span
                    className={
                      todo.status === "DONE"
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }
                  >
                    {todo.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium">Live-session pågår</p>
          <p className="text-xs text-amber-700 mt-1">
            Använd specialist-panelen till höger för att konsultera en agent under mötet.
          </p>
        </div>
      </div>

      {/* HÖGER: AgentPanel */}
      <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Agentpanel
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <AgentPanel
            startupId={id}
            sessionId={sessionId}
            availableAgents={panelAgents.map((a) => ({
              slug: a.slug,
              name: a.name,
              title: a.title,
              description: a.description,
              avatarStyle: a.avatarStyle,
              avatarSeed: a.avatarSeed,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
