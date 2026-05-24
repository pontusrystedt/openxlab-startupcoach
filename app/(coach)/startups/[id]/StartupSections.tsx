"use client"

import { useState } from "react"
import Link from "next/link"
import { TodoList } from "@/app/components/todos/TodoList"

interface Session {
  id: string
  sessionNumber: number
  scheduledAt: string
  phase: string
  todoCount: number
  hasSummary: boolean
}

interface Todo {
  id: string
  text: string
  comment: string | null
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "DELETED"
  priority: number
  dueDate: string | null
  createdAt: string
  agentSource: string | null
  sessionNumber: number
}

interface Props {
  startupId: string
  sessions: Session[]
  todos: Todo[]
}

const PHASE_LABEL: Record<string, string> = {
  SOCIAL: "Social",
  IRL_CHECK: "IRL-check",
  COACHING: "Coaching",
  PRIORITIZATION: "Prioritering",
  CLOSING: "Avslutning",
}

function CollapseSection({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{title}</span>
          {badge !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  )
}

export function StartupSections({ startupId, sessions, todos }: Props) {
  const activeTodos = todos.filter((t) => t.status !== "DELETED")

  return (
    <div className="space-y-3">
      {/* Möten */}
      <CollapseSection
        title="Möten"
        badge={sessions.length}
        defaultOpen={true}
      >
        <div className="px-4 py-3 flex justify-end border-b border-gray-50">
          <Link
            href={`/startups/${startupId}/sessions`}
            className="text-xs text-[#1D9E75] hover:underline"
          >
            + Nytt möte
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Inga möten ännu</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Fas</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Todos</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Summary</th>
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
                  <td className="px-4 py-3 text-gray-600">{session.todoCount}</td>
                  <td className="px-4 py-3">
                    {session.hasSummary ? (
                      <span className="text-green-600 text-xs">Klar</span>
                    ) : (
                      <span className="text-gray-400 text-xs">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapseSection>

      {/* Todos */}
      <CollapseSection
        title="Todos"
        badge={activeTodos.length}
        defaultOpen={activeTodos.length > 0}
      >
        <div className="p-4">
          {todos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Inga todos ännu — genereras automatiskt efter mötet.
            </p>
          ) : (
            <TodoList todos={todos} isCoach={true} />
          )}
        </div>
      </CollapseSection>
    </div>
  )
}
