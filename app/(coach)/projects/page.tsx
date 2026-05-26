"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Startup {
  id: string
  name: string
}

interface ProjectStartup {
  startup: Startup
}

interface Project {
  id: string
  name: string
  funderName: string
  periodStart: string
  periodEnd: string
  requirementText: string | null
  startups: ProjectStartup[]
}

const EMPTY_FORM = {
  name: "",
  funderName: "",
  periodStart: "",
  periodEnd: "",
  requirementText: "",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [allStartups, setAllStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingStartup, setAddingStartup] = useState<string | null>(null) // projectId

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/startups").then((r) => r.json()),
    ]).then(([proj, startups]) => {
      setProjects(proj)
      setAllStartups(startups)
    }).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requirementText: form.requirementText || null,
      }),
    })
    if (res.ok) {
      const project = await res.json()
      setProjects((prev) => [{ ...project, startups: [] }, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } else {
      const err = await res.json()
      alert(err.error ?? "Kunde inte skapa projekt")
    }
    setSaving(false)
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Ta bort projektet?")) return
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  async function handleAddStartup(projectId: string, startupId: string) {
    const res = await fetch(`/api/projects/${projectId}/startups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId }),
    })
    if (res.ok) {
      const startup = allStartups.find((s) => s.id === startupId)!
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, startups: [...p.startups, { startup }] }
            : p
        )
      )
      setAddingStartup(null)
    }
  }

  async function handleRemoveStartup(projectId: string, startupId: string) {
    await fetch(`/api/projects/${projectId}/startups/${startupId}`, { method: "DELETE" })
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, startups: p.startups.filter((s) => s.startup.id !== startupId) }
          : p
      )
    )
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Finansiärsprojekt</h1>
          <p className="text-gray-500 text-sm">Koppla startups till finansiärsprojekt</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#188a65]"
        >
          + Nytt projekt
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Nytt finansiärsprojekt</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Projektnamn *</label>
              <input required value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Finansiär *</label>
              <input required value={form.funderName}
                onChange={(e) => setForm((f) => ({ ...f, funderName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Startdatum *</label>
              <input required type="date" value={form.periodStart}
                onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slutdatum *</label>
              <input required type="date" value={form.periodEnd}
                onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Krav / anteckningar</label>
            <textarea value={form.requirementText}
              onChange={(e) => setForm((f) => ({ ...f, requirementText: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Sparar…" : "Skapa projekt"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Avbryt
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga projekt registrerade ännu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const linkedIds = new Set(project.startups.map((s) => s.startup.id))
            const available = allStartups.filter((s) => !linkedIds.has(s.id))
            const isExpanded = expandedId === project.id

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.funderName} · {new Date(project.periodStart).toLocaleDateString("sv-SE")} – {new Date(project.periodEnd).toLocaleDateString("sv-SE")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {project.startups.length} startups
                    </span>
                    <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {project.requirementText && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{project.requirementText}</p>
                    )}

                    {/* Kopplade startups */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Kopplade startups</p>
                        {available.length > 0 && (
                          <button
                            onClick={() => setAddingStartup(addingStartup === project.id ? null : project.id)}
                            className="text-xs text-[#1D9E75] hover:underline"
                          >
                            + Lägg till startup
                          </button>
                        )}
                      </div>

                      {addingStartup === project.id && (
                        <div className="mb-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-2">Välj startup att koppla:</p>
                          <div className="flex flex-wrap gap-2">
                            {available.map((s) => (
                              <button key={s.id}
                                onClick={() => handleAddStartup(project.id, s.id)}
                                className="text-xs px-3 py-1.5 border border-[#1D9E75] text-[#1D9E75] rounded-full hover:bg-[#1D9E75]/10">
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {project.startups.length === 0 ? (
                        <p className="text-sm text-gray-400">Inga startups kopplade ännu.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {project.startups.map(({ startup }) => (
                            <div key={startup.id} className="flex items-center gap-1 bg-[#1D9E75]/10 rounded-full px-2 py-0.5">
                              <Link href={`/startups/${startup.id}`}
                                className="text-xs text-[#1D9E75] hover:underline">
                                {startup.name}
                              </Link>
                              <button
                                onClick={() => handleRemoveStartup(project.id, startup.id)}
                                className="text-[#1D9E75]/50 hover:text-red-500 text-xs ml-0.5"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => handleDelete(project.id)}
                        className="text-xs text-gray-400 hover:text-red-500">
                        Ta bort projekt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
