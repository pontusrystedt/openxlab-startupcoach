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
  agentType: "PROCESS" | "SUBJECT_MATTER"
  tier: string
  defaultCollections: string[]
  sortOrder: number
}

export default function AdminAgentsPage({ isSystemAdmin = false }: { isSystemAdmin?: boolean }) {
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

  function toFormInitial(agent: Agent): Partial<AgentFormData> {
    return {
      slug: agent.slug,
      name: agent.name,
      title: agent.title ?? "",
      description: agent.description,
      bio: agent.bio ?? "",
      personality: agent.personality ?? "",
      systemPrompt: agent.systemPrompt,
      knowledgeCollection: agent.knowledgeCollection,
      trigger: agent.trigger,
      maxTokens: agent.maxTokens,
      avatarStyle: agent.avatarStyle,
      avatarSeed: agent.avatarSeed ?? "",
      tier: agent.tier ?? "standard",
      defaultCollections: agent.defaultCollections ?? ["general"],
    }
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  if (view === "new" || view === "edit") {
    const isProcess = editAgent?.agentType === "PROCESS"
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
          isProcess={isProcess}
          isSystemAdmin={isSystemAdmin}
          initial={editAgent ? toFormInitial(editAgent) : {}}
          onSave={handleSave}
          onCancel={goBack}
        />
      </div>
    )
  }

  const processAgents = [...agents]
    .filter((a) => a.agentType === "PROCESS")
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const subjectAgents = [...agents]
    .filter((a) => a.agentType === "SUBJECT_MATTER")
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Agenter</h1>
        <button
          onClick={() => setView("new")}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
        >
          + Ny agent
        </button>
      </div>

      {/* Processagenter */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Processagenter</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Dessa agenter är en del av plattformens kärnfunktion och körs automatiskt.
            De kan inte inaktiveras.
          </p>
        </div>
        {processAgents.length === 0 ? (
          <p className="text-sm text-gray-400">
            Inga processagenter hittades — kör seed-SQL.
          </p>
        ) : (
          processAgents.map((agent) => (
            <AgentCard
              key={agent.slug}
              agent={{ ...agent, isSystemAgent: true }}
              showBio
              onEdit={() => {
                setEditAgent(agent)
                setView("edit")
              }}
            />
          ))
        )}
      </section>

      {/* Specialistagenter */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Specialistagenter</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Kallas in av coach vid behov. Du kan aktivera, inaktivera och skapa nya
            agenter.
          </p>
        </div>
        {subjectAgents.length === 0 ? (
          <p className="text-sm text-gray-400">Inga specialistagenter ännu.</p>
        ) : (
          subjectAgents.map((agent) => (
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
          ))
        )}
      </section>
    </div>
  )
}
