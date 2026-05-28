"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface ProjectFile {
  id: string
  type: string
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
  title: string | null
  uploadedAt: string
}

function ProjectFiles({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [savingLink, setSavingLink] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/files`)
      .then((r) => r.json())
      .then(setFiles)
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch(`/api/projects/${projectId}/files`, { method: "POST", body: fd })
    if (res.ok) {
      const record = await res.json()
      setFiles((prev) => [record, ...prev])
    }
    setUploading(false)
    e.target.value = ""
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    setSavingLink(true)
    const res = await fetch(`/api/projects/${projectId}/files/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, url: linkUrl }),
    })
    if (res.ok) {
      const record = await res.json()
      setFiles((prev) => [record, ...prev])
      setLinkTitle(""); setLinkUrl(""); setShowLinkForm(false)
    }
    setSavingLink(false)
  }

  async function handleDownload(fileId: string, fileName: string) {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}/download`)
    if (res.ok) {
      const { url } = await res.json()
      const a = document.createElement("a"); a.href = url; a.download = fileName; a.target = "_blank"; a.click()
    }
  }

  async function handleDelete(fileId: string) {
    await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE" })
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Ansökningar & dokument</p>
        <div className="flex gap-3">
          <button onClick={() => setShowLinkForm(!showLinkForm)} className="text-xs text-[#1D9E75] hover:underline">
            + Lägg till länk
          </button>
          <label className={`text-xs text-[#1D9E75] hover:underline cursor-pointer ${uploading ? "opacity-50" : ""}`}>
            {uploading ? "Laddar upp…" : "+ Ladda upp fil"}
            <input type="file" className="hidden" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
              onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {showLinkForm && (
        <form onSubmit={handleAddLink} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titel *</label>
              <input required value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
              <input required type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={savingLink}
              className="px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg text-xs font-medium disabled:opacity-50">
              {savingLink ? "Sparar…" : "Spara"}
            </button>
            <button type="button" onClick={() => setShowLinkForm(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100">
              Avbryt
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Laddar…</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-gray-400">Inga filer uppladdade ännu.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-1.5">
              <div>
                {f.type === "LINK" ? (
                  <a href={f.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#1D9E75] hover:underline">🔗 {f.title ?? f.url}</a>
                ) : (
                  <p className="text-sm text-gray-800">📄 {f.fileName}</p>
                )}
                <p className="text-xs text-gray-400">
                  {f.sizeBytes ? `${formatBytes(f.sizeBytes)} · ` : ""}
                  {new Date(f.uploadedAt).toLocaleDateString("sv-SE")}
                </p>
              </div>
              <div className="flex gap-3">
                {f.type === "FILE" && f.fileName && (
                  <button onClick={() => handleDownload(f.id, f.fileName!)}
                    className="text-xs text-[#1D9E75] hover:underline">Ladda ner</button>
                )}
                <button onClick={() => handleDelete(f.id)}
                  className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects).finally(() => setLoading(false))
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
            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <Link href={`/projects/${project.id}`} className="flex-1 hover:opacity-80">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.funderName} · {new Date(project.periodStart).toLocaleDateString("sv-SE")} – {new Date(project.periodEnd).toLocaleDateString("sv-SE")}</p>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {project.startups.length} startups
                    </span>
                    <button onClick={() => handleDelete(project.id)}
                      className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
