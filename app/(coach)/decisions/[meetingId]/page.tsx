import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import DecisionList from "./DecisionList"

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>
}) {
  const session = await requireCoach()
  const { meetingId } = await params

  const meeting = await prisma.coachMeeting.findUnique({
    where: { id: meetingId },
    include: {
      decisions: {
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        include: {
          startup: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!meeting || meeting.orgId !== session.user.orgId) {
    notFound()
  }

  const meetingData = {
    id: meeting.id,
    title: meeting.title,
    meetingDate: meeting.meetingDate.toISOString(),
    klangFileId: meeting.klangFileId,
    agentRan: meeting.agentRan,
    decisions: meeting.decisions.map((d) => ({
      id: d.id,
      text: d.text,
      comment: d.comment,
      status: d.status,
      priority: d.priority,
      agentSource: d.agentSource,
      createdAt: d.createdAt.toISOString(),
      startup: d.startup,
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/decisions"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Decisions
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">
          {meeting.title}
        </h1>
        <p className="text-gray-500 text-sm">
          {new Date(meeting.meetingDate).toLocaleDateString("sv-SE")} ·{" "}
          {meeting.decisions.length} beslut
        </p>
      </div>

      <DecisionList meeting={meetingData} />
    </div>
  )
}
