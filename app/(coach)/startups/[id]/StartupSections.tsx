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

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface Props {
  startupId: string
  sessions: Session[]
  todos: Todo[]
  teamMembers: TeamMember[]
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

function TeamSection({ startupId, initial }: { startupId: string; initial: TeamMember[] }) {
  const [members, setMembers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/startups/${startupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const member = await res.json()
      setMembers((prev) => [...prev, member])
      setForm({ firstName: "", lastName: "", email: "", phone: "" })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleRemove(id: string) {
    await fetch(`/api/startups/${startupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: id }),
    })
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="p-4 space-y-3">
      {members.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">Inga teammedlemmar tillagda ännu.</p>
      )}

      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div>
            <p className="text-sm font-medium text-gray-900">{m.firstName} {m.lastName}</p>
            <p className="text-xs text-gray-500">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
          </div>
          <button
            onClick={() => handleRemove(m.id)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Ta bort
          </button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleAdd} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Förnamn *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Efternamn *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-post *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Valfritt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Sparar…" : "Lägg till"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-[#1D9E75] hover:underline"
        >
          + Lägg till teammedlem
        </button>
      )}
    </div>
  )
}

export function StartupSections({ startupId, sessions, todos, teamMembers }: Props) {
  const activeTodos = todos.filter((t) => t.status !== "DELETED")

  return (
    <div className="space-y-3">
      {/* Team */}
      <CollapseSection title="Team" badge={teamMembers.length} defaultOpen={true}>
        <TeamSection startupId={startupId} initial={teamMembers} />
      </CollapseSection>

      {/* Möten */}
      <CollapseSection title="Möten" badge={sessions.length} defaultOpen={true}>
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

      {/* Todos — alla från alla möten */}
      <CollapseSection title="Todos" badge={activeTodos.length} defaultOpen={activeTodos.length > 0}>
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
