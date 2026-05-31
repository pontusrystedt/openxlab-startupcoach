export const dynamic = "force-dynamic"

import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { getAvailableAgents } from "@/lib/agents/agent-runner"
import { notFound } from "next/navigation"
import { LiveSupportClient } from "@/components/live/LiveSupportClient"

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const session = await requireCoach()
  const { id, sessionId } = await params

  const [coachingSession, questions] = await Promise.all([
    prisma.session.findUnique({
      where: { id: sessionId },
      include: { startup: true },
    }),
    prisma.meetingQuestion.findMany({
      where: { sessionId },
      orderBy: { priority: "asc" },
    }),
  ])

  if (!coachingSession || coachingSession.startupId !== id) notFound()

  const allAgents = await getAvailableAgents(session.user.orgId)
  const availableAgents = allAgents.filter(
    (a) => a.trigger === "ON_DEMAND" || a.trigger === "DURING_MEETING"
  )

  return (
    <LiveSupportClient
      session={{
        id: coachingSession.id,
        sessionNumber: coachingSession.sessionNumber,
        startupId: coachingSession.startupId,
        liveNotes: coachingSession.liveNotes,
        startup: { name: coachingSession.startup.name },
      }}
      initialQuestions={questions.map((q) => ({
        id: q.id,
        text: q.text,
        category: q.category,
        agentSlug: q.agentSlug,
        isChecked: q.isChecked,
        priority: q.priority,
      }))}
      availableAgents={availableAgents.map((a) => ({
        slug: a.slug,
        name: a.name,
        title: a.title,
        description: a.description,
        avatarStyle: a.avatarStyle,
        avatarSeed: a.avatarSeed,
        trigger: a.trigger,
      }))}
    />
  )
}
