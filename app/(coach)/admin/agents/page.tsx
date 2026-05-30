"use client"

import { useState, useEffect } from "react"

interface Agent {
  id: string
  slug: string
  name: string
  description: string
  trigger: string
  isActive: boolean
  isSystemAgent: boolean
  sortOrder: number
  knowledgeCollection: string
}

const TRIGGER_LABELS: Record<string, string> = {
  ALWAYS: "Alltid",
  ON_DEMAND: "Manuellt",
  POST_MEETING: "Efter möte",
  DURING_MEETING: "Under möte",
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/agents")
      .then((r) => r.json())
      .then(setAgents)
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(slug: string) {
    setTogglingSlug(slug)
    const res = await fetch(`/api/admin/agents/${slug}/toggle`, {
      method: "PATCH",
    })
    if (res.ok) {
      const updated = await res.json()
      setAgents((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, isActive: updated.isActive } : a))
      )
    }
    setTogglingSlug(null)
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Agenter</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aktivera och inaktivera specialistagenter. Systemagenter kan inte ändras.
        </p>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-medium text-gray-900">{agent.name}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      agent.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {agent.isActive ? "Aktiv" : "På bänken"}
                  </span>
                  {agent.isSystemAgent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      System
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                    {TRIGGER_LABELS[agent.trigger] ?? agent.trigger}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{agent.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Knowledge-samling:{" "}
                  <code className="bg-gray-50 px-1 rounded">{agent.knowledgeCollection}</code>
                </p>
              </div>

              <button
                onClick={() => handleToggle(agent.slug)}
                disabled={agent.isSystemAgent || togglingSlug === agent.slug}
                className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  agent.isActive
                    ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "border-[#1D9E75] text-[#1D9E75] hover:bg-green-50"
                }`}
              >
                {togglingSlug === agent.slug
                  ? "…"
                  : agent.isActive
                  ? "Inaktivera"
                  : "Aktivera"}
              </button>
            </div>
          </div>
        ))}

        {agents.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">
              Inga agenter hittades. Kör seed-SQL i databasen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
