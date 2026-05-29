import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import { decrypt } from "@/lib/crypto"
import Link from "next/link"
import { notFound } from "next/navigation"
import ProjectMeetingKlangForm from "./ProjectMeetingKlangForm"

export default async function ProjectMeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; mid: string }>
}) {
  await requireCoach()
  const { id, mid } = await params

  const meeting = await prisma.projectMeeting.findUnique({
    where: { id: mid },
    include: {
      project: { select: { id: true, name: true } },
      todos: { orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
    },
  })

  if (!meeting || meeting.projectId !== id) notFound()

  const transcriptText =
    meeting.transcriptEncrypted && meeting.transcriptIv && meeting.transcriptAuthTag
      ? decrypt(meeting.transcriptEncrypted, meeting.transcriptIv, meeting.transcriptAuthTag)
      : null

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {meeting.project.name}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">
          Möte #{meeting.meetingNumber}
        </h1>
        <p className="text-gray-500 text-sm">
          {new Date(meeting.scheduledAt).toLocaleDateString("sv-SE")}
        </p>
      </div>

      {/* Klang-koppling */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3">Klang.ai-transkription</h2>
        {meeting.klangFileId ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              File ID: <code className="bg-gray-100 px-1 rounded">{meeting.klangFileId}</code>
            </p>
            {transcriptText ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-[#1D9E75] hover:underline">
                  Visa transkript
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap text-gray-700 max-h-96 overflow-y-auto">
                  {transcriptText}
                </pre>
              </details>
            ) : (
              <p className="text-sm text-amber-600">Inväntar transkription från Klang.ai…</p>
            )}
          </div>
        ) : (
          <ProjectMeetingKlangForm projectId={id} meetingId={mid} />
        )}
      </div>

      {/* AI-sammanfattning */}
      {(meeting.summaryInsight || meeting.summaryCoachNote) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-2">AI-sammanfattning</h2>
          {meeting.summaryInsight && (
            <p className="text-sm text-gray-700 mb-3">{meeting.summaryInsight}</p>
          )}
          {meeting.summaryCoachNote && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Notering (intern)</p>
              <p className="text-sm text-gray-600 italic">{meeting.summaryCoachNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Todos */}
      {meeting.todos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">
            Todos ({meeting.todos.length})
          </h2>
          <ol className="space-y-2">
            {meeting.todos.map((todo, i) => (
              <li key={todo.id} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1D9E75] text-white text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <p className={`text-gray-800 ${todo.status === "DONE" ? "line-through text-gray-400" : ""}`}>
                  {todo.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!meeting.klangFileId && meeting.todos.length === 0 && !meeting.summaryInsight && (
        <p className="text-sm text-gray-400 text-center py-4">
          Koppla ett Klang-möte för att starta AI-analysen.
        </p>
      )}
    </div>
  )
}
