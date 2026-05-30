import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import { decrypt } from "@/lib/crypto"
import Link from "next/link"
import { notFound } from "next/navigation"
import KlangFileForm from "./KlangFileForm"

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  await requireCoach()
  const { id, sessionId } = await params

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      startup: true,
      transcript: true,
      summary: true,
      todos: {
        orderBy: { priority: "asc" },
        include: { feedback: true },
      },
    },
  })

  if (!session || session.startupId !== id) notFound()

  const summary = session.summary
    ? JSON.parse(
        decrypt(session.summary.encryptedData, session.summary.iv, session.summary.authTag)
      )
    : null

  const transcriptText =
    session.transcript?.encryptedText
      ? decrypt(
          session.transcript.encryptedText,
          session.transcript.iv,
          session.transcript.authTag
        )
      : null

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/coaching/${id}/sessions`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {session.startup.name} / Sessions
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Session #{session.sessionNumber}
          </h1>
          <Link
            href={`/coaching/${id}/sessions/${sessionId}/live`}
            className="px-3 py-1 text-xs bg-amber-500 text-white rounded-full hover:bg-amber-600 font-medium"
          >
            ▶ Live-panel
          </Link>
        </div>
        <p className="text-gray-500 text-sm">
          {new Date(session.scheduledAt).toLocaleDateString("sv-SE")} · {session.phase}
        </p>
      </div>

      {/* Klang.ai koppling */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3">Klang.ai-transkription</h2>
        {session.transcript ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              File ID: <code className="bg-gray-100 px-1 rounded">{session.transcript.klangFileId}</code>
            </p>
            {transcriptText ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-[#1D9E75] hover:underline">
                  Visa transkript
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap text-gray-700">
                  {transcriptText}
                </pre>
              </details>
            ) : (
              <p className="text-sm text-amber-600">Inväntar transkription från Klang.ai…</p>
            )}
          </div>
        ) : (
          <KlangFileForm sessionId={sessionId} />
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-2">AI-sammanfattning</h2>
          <p className="text-sm text-gray-700 mb-3">{summary.insight}</p>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Coach-notering (intern)</p>
            <p className="text-sm text-gray-600 italic">{summary.coachNote}</p>
          </div>
        </div>
      )}

      {/* Todos */}
      {session.todos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">
              Todos ({session.todos.length})
            </h2>
          </div>
          <ol className="space-y-2">
            {session.todos.map((todo) => (
              <li key={todo.id} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1D9E75] text-white text-xs flex items-center justify-center font-medium">
                  {todo.priority}
                </span>
                <p className={`text-gray-800 ${todo.completedAt ? "line-through text-gray-400" : ""}`}>
                  {todo.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!summary && !session.transcript && (
        <p className="text-sm text-gray-400 text-center py-4">
          Koppla ett Klang.ai file ID för att starta AI-analysen efter mötet.
        </p>
      )}
    </div>
  )
}
