import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { decrypt } from "@/lib/crypto"
import Link from "next/link"
import EntrepreneurSessionTodos from "./EntrepreneurSessionTodos"

export default async function EntrepreneurSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const userSession = await auth()
  if (!userSession?.user.startupId) redirect("/login")

  const { sessionId } = await params

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      transcript: true,
      summary: true,
      todos: {
        orderBy: { priority: "asc" },
        include: { feedback: true },
      },
    },
  })

  if (!session || session.startupId !== userSession.user.startupId) notFound()

  const summary = session.summary
    ? JSON.parse(decrypt(session.summary.encryptedData, session.summary.iv, session.summary.authTag))
    : null

  const transcriptText =
    session.transcript?.encryptedText
      ? decrypt(session.transcript.encryptedText, session.transcript.iv, session.transcript.authTag)
      : null

  const PHASE_LABEL: Record<string, string> = {
    COACHING: "Coaching", SOCIAL: "Social", IRL_CHECK: "IRL-check",
    PRIORITIZATION: "Prioritering", CLOSING: "Avslutning",
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/my/sessions" className="text-sm text-gray-500 hover:text-gray-700">
          ← Möten
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">
          Session #{session.sessionNumber}
        </h1>
        <p className="text-gray-500 text-sm">
          {new Date(session.scheduledAt).toLocaleDateString("sv-SE")} · {PHASE_LABEL[session.phase] ?? session.phase}
        </p>
      </div>

      {/* AI-sammanfattning */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-2">Sammanfattning</h2>
          <p className="text-sm text-gray-700 mb-3">{summary.insight}</p>
          {summary.coachNote && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Coachens notering</p>
              <p className="text-sm text-gray-600 italic">{summary.coachNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Todos */}
      {session.todos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-3">
            Todos ({session.todos.length})
          </h2>
          <EntrepreneurSessionTodos
            todos={session.todos.map((t) => ({
              id: t.id,
              text: t.text,
              priority: t.priority,
              completedAt: t.completedAt?.toISOString() ?? null,
              dueDate: t.dueDate?.toISOString() ?? null,
            }))}
          />
        </div>
      )}

      {/* Transkript */}
      {transcriptText && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-3">Transkript</h2>
          <details>
            <summary className="cursor-pointer text-sm text-[#1D9E75] hover:underline">
              Visa fullständigt transkript
            </summary>
            <pre className="mt-3 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap text-gray-700 max-h-96 overflow-y-auto">
              {transcriptText}
            </pre>
          </details>
        </div>
      )}

      {!summary && !transcriptText && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Transkript och sammanfattning är inte klara ännu.</p>
        </div>
      )}
    </div>
  )
}
