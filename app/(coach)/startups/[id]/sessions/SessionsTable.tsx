"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Session = {
  id: string
  sessionNumber: number
  scheduledAt: string
  phase: string
  summary: object | null
  _count: { todos: number }
}

const PHASE_LABEL: Record<string, string> = {
  COACHING: "Coaching",
  SOCIAL: "Social",
  IRL_CHECK: "IRL-check",
  PRIORITIZATION: "Prioritering",
  CLOSING: "Avslutning",
}

export default function SessionsTable({
  startupId,
  sessions,
}: {
  startupId: string
  sessions: Session[]
}) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/sessions/${deleteTarget.id}`, { method: "DELETE" })
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Fas</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Todos</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sammanfattning</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/startups/${startupId}/sessions/${session.id}`}
                    className="text-[#1D9E75] hover:underline font-medium"
                  >
                    #{session.sessionNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(session.scheduledAt).toLocaleDateString("sv-SE")}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {PHASE_LABEL[session.phase] ?? session.phase}
                </td>
                <td className="px-4 py-3 text-gray-600">{session._count.todos}</td>
                <td className="px-4 py-3">
                  {session.summary ? (
                    <span className="text-green-600 text-xs">Klar</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Inväntar transkript</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setDeleteTarget(session)}
                    className="text-xs text-red-400 hover:text-red-600 hover:underline"
                  >
                    Radera
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <p className="text-center py-10 text-gray-400">Inga sessioner ännu</p>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Radera möte</h2>
            <p className="text-sm text-gray-600 mb-1">
              Vill du verkligen radera{" "}
              <strong>
                Session #{deleteTarget.sessionNumber} —{" "}
                {new Date(deleteTarget.scheduledAt).toLocaleDateString("sv-SE")}
              </strong>?
            </p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 my-4">
              Transkript, sammanfattning och todos kopplade till mötet raderas permanent.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Raderar…" : "Ja, radera"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
