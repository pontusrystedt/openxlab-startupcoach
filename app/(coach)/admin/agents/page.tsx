"use client"

import { useState, useEffect } from "react"
import { AgentCard } from "@/components/agents/AgentCard"
import { AgentForm, type AgentFormData } from "@/components/agents/AgentForm"

type View = "list" | "new" | "edit"

interface Agent {
  id: string
  slug: string
  name: string
  title: string | null
  description: string
  bio: string | null
  personality: string | null
  systemPrompt: string
  knowledgeCollection: string
  trigger: string
  maxTokens: number
  avatarStyle: string
  avatarSeed: string | null
  isActive: boolean
  isSystemAgent: boolean
  sortOrder: number
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("list")
  const [editAgent, setEditAgent] = useState<Agent | null>(null)

  useEffect(() => {
    fetch("/api/admin/agents")
      .then((r) => r.json())
      .then(setAgents)
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(slug: string) {
    const res = await fetch(`/api/admin/agents/${slug}/toggle`, { method: "PATCH" })
    if (res.ok) {
      setAgents((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, isActive: !a.isActive } : a))
      )
    }
  }

  async function handleSave(data: AgentFormData) {
    const isNew = view === "new"
    const res = await fetch(
      isNew ? "/api/admin/agents" : `/api/admin/agents/${editAgent!.slug}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    )
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error)
    }
    const saved: Agent = await res.json()
    if (isNew) {
      setAgents((prev) => [...prev, saved])
    } else {
      setAgents((prev) => prev.map((a) => (a.slug === saved.slug ? saved : a)))
    }
    setView("list")
    setEditAgent(null)
  }

  function goBack() {
    setView("list")
    setEditAgent(null)
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  if (view === "new" || view === "edit") {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={goBack} className="text-sm text-gray-500 hover:text-gray-700">
            ← Tillbaka
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {view === "new" ? "Skapa ny agent" : `Redigera ${editAgent?.name}`}
          </h1>
        </div>
        <AgentForm
          isNew={view === "new"}
          initial={
            editAgent
              ? {
                  slug: editAgent.slug,
                  name: editAgent.name,
                  title: editAgent.title ?? "",
                  description: editAgent.description,
                  bio: editAgent.bio ?? "",
                  personality: editAgent.personality ?? "",
                  systemPrompt: editAgent.systemPrompt,
                  knowledgeCollection: editAgent.knowledgeCollection,
                  trigger: editAgent.trigger,
                  maxTokens: editAgent.maxTokens,
                  avatarStyle: editAgent.avatarStyle,
                  avatarSeed: editAgent.avatarSeed ?? "",
                }
              : {}
          }
          onSave={handleSave}
          onCancel={goBack}
        />
      </div>
    )
  }

  const sorted = [...agents].sort((a, b) => a.sortOrder - b.sortOrder)
  const activeCount = agents.filter((a) => a.isActive).length
  const inactiveCount = agents.length - activeCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agenter</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} aktiva · {inactiveCount} på bänken
          </p>
        </div>
        <button
          onClick={() => setView("new")}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
        >
          + Ny agent
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((agent) => (
          <AgentCard
            key={agent.slug}
            agent={agent}
            showBio
            onToggle={() => handleToggle(agent.slug)}
            onEdit={() => {
              setEditAgent(agent)
              setView("edit")
            }}
          />
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
