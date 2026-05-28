"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Startup { id: string; name: string }
interface ProjectTodo {
  id: string; text: string; status: string; priority: number
  dueDate: string | null; createdAt: string; meetingId: string | null
}
interface Meeting {
  id: string; meetingNumber: number; scheduledAt: string
  klangFileId: string | null; createdAt: string; todos: ProjectTodo[]
}
interface Project {
  id: string; orgId: string
  startups: { startup: Startup }[]
  meetings: Meeting[]
  todos: ProjectTodo[]
}

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Ej påbörjad", IN_PROGRESS: "Pågår", DONE: "Klar",
}
const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
}

function CollapseSection({ title, badge, defaultOpen = false, children }: {
  title: string; badge?: string | number; defaultOpen?: boolean; children: React.ReactNode
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
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{badge}</span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  )
}

type KlangConversation = { id: string; title: string; created_at: string }

function KlangPicker({ projectId, meetingId, onLinked }: {
  projectId: string; meetingId: string; onLinked: (id: string) => void
}) {
  const [conversations, setConversations] = useState<KlangConversation[]>([])
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchConversations() {
    setLoading(true)
    const res = await fetch("/api/klang/conversations")
    const data = await res.json()
    if (data.error) { setError(data.error) } else { setConversations(data.data ?? []) }
    setFetched(true)
    setLoading(false)
  }

  async function handleLink(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    const res = await fetch(`/api/projects/${projectId}/meetings/${meetingId}/klang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klangFileId: selected }),
    })
    if (res.ok) onLinked(selected)
  }

  if (!fetched) return (
    <button onClick={fetchConversations} disabled={loading}
      className="text-xs text-[#1D9E75] hover:underline disabled:opacity-50">
      {loading ? "Hämtar…" : "Välj Klang-möte"}
    </button>
  )

  if (error) return (
    <p className="text-xs text-red-600">{error}{" "}
      {error.includes("nyckel") && <a href="/settings/klang" className="underline">Konfigurera →</a>}
    </p>
  )

  return (
    <form onSubmit={handleLink} className="flex gap-2 items-center">
      <select value={selected} onChange={(e) => setSelected(e.target.value)} required
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]">
        <option value="">Välj möte…</option>
        {conversations.map((c) => (
          <option key={c.id} value={c.id}>
            {new Date(c.created_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })} — {c.title}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!selected}
        className="px-2 py-1 bg-[#1D9E75] text-white rounded text-xs disabled:opacity-50">
        Koppla
      </button>
    </form>
  )
}

export default function ProjectSections({ project, allStartups }: {
  project: Project; allStartups: Startup[]
}) {
  const [meetings, setMeetings] = useState(project.meetings)
  const [todos, setTodos] = useState(project.todos)
  const [startups, setStartups] = useState(project.startups)
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newMeetingDate, setNewMeetingDate] = useState("")
  const [addingMeeting, setAddingMeeting] = useState(false)
  const [newTodoText, setNewTodoText] = useState("")
  const [addingStartupId, setAddingStartupId] = useState("")
  const [showStartupPicker, setShowStartupPicker] = useState(false)

  const linkedIds = new Set(startups.map((s) => s.startup.id))
  const available = allStartups.filter((s) => !linkedIds.has(s.id))

  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/projects/${project.id}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: newMeetingDate }),
    })
    if (res.ok) {
      const m = await res.json()
      setMeetings((prev) => [m, ...prev])
      setNewMeetingDate("")
      setAddingMeeting(false)
    }
  }

  async function handleDeleteMeeting() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/projects/${project.id}/meetings/${deleteTarget.id}`, { method: "DELETE" })
    setMeetings((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!newTodoText.trim()) return
    const res = await fetch(`/api/projects/${project.id}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newTodoText }),
    })
    if (res.ok) {
      const todo = await res.json()
      setTodos((prev) => [...prev, todo])
      setNewTodoText("")
    }
  }

  async function handleTodoStatus(id: string, status: string) {
    await fetch(`/api/projects/${project.id}/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
  }

  async function handleDeleteTodo(id: string) {
    await fetch(`/api/projects/${project.id}/todos/${id}`, { method: "DELETE" })
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleAddStartup() {
    if (!addingStartupId) return
    const res = await fetch(`/api/projects/${project.id}/startups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId: addingStartupId }),
    })
    if (res.ok) {
      const s = allStartups.find((s) => s.id === addingStartupId)!
      setStartups((prev) => [...prev, { startup: s }])
      setAddingStartupId("")
      setShowStartupPicker(false)
    }
  }

  async function handleRemoveStartup(startupId: string) {
    await fetch(`/api/projects/${project.id}/startups/${startupId}`, { method: "DELETE" })
    setStartups((prev) => prev.filter((s) => s.startup.id !== startupId))
  }

  const activeTodos = todos.filter((t) => t.status !== "DONE")

  return (
    <>
      <div className="space-y-3">
        {/* Kopplade startups */}
        <CollapseSection title="Kopplade startups" badge={startups.length}>
          <div className="p-4 space-y-3">
            {startups.length === 0 && !showStartupPicker && (
              <p className="text-sm text-gray-400">Inga startups kopplade ännu.</p>
            )}
            {startups.map(({ startup }) => (
              <div key={startup.id} className="flex items-center justify-between">
                <Link href={`/startups/${startup.id}`} className="text-sm text-[#1D9E75] hover:underline">
                  {startup.name}
                </Link>
                <button onClick={() => handleRemoveStartup(startup.id)}
                  className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
              </div>
            ))}
            {showStartupPicker && available.length > 0 && (
              <div className="flex gap-2 items-center">
                <select value={addingStartupId} onChange={(e) => setAddingStartupId(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]">
                  <option value="">Välj startup…</option>
                  {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={handleAddStartup} disabled={!addingStartupId}
                  className="px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg text-sm disabled:opacity-50">Lägg till</button>
                <button onClick={() => setShowStartupPicker(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600">Avbryt</button>
              </div>
            )}
            {!showStartupPicker && available.length > 0 && (
              <button onClick={() => setShowStartupPicker(true)} className="text-sm text-[#1D9E75] hover:underline">
                + Koppla startup
              </button>
            )}
          </div>
        </CollapseSection>

        {/* Möten */}
        <CollapseSection title="Möten" badge={meetings.length}>
          <div className="px-4 py-3 flex justify-end border-b border-gray-50">
            {addingMeeting ? (
              <form onSubmit={handleAddMeeting} className="flex gap-2 items-center">
                <input type="date" required value={newMeetingDate}
                  onChange={(e) => setNewMeetingDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
                <button type="submit" className="px-3 py-1 bg-[#1D9E75] text-white rounded text-sm">Skapa</button>
                <button type="button" onClick={() => setAddingMeeting(false)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600">Avbryt</button>
              </form>
            ) : (
              <button onClick={() => setAddingMeeting(true)} className="text-xs text-[#1D9E75] hover:underline">
                + Nytt möte
              </button>
            )}
          </div>

          {meetings.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Inga möten ännu</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Datum</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Klang</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">#{m.meetingNumber}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(m.scheduledAt).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="px-4 py-3">
                      {m.klangFileId ? (
                        <span className="text-xs text-green-600">Kopplat ✓</span>
                      ) : (
                        <KlangPicker
                          projectId={project.id}
                          meetingId={m.id}
                          onLinked={(id) =>
                            setMeetings((prev) =>
                              prev.map((x) => x.id === m.id ? { ...x, klangFileId: id } : x)
                            )
                          }
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteTarget(m)}
                        className="text-xs text-red-400 hover:text-red-600 hover:underline">Radera</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CollapseSection>

        {/* Todos */}
        <CollapseSection title="Todos" badge={activeTodos.length}>
          <div className="p-4 space-y-3">
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Ny todo…"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
              <button type="submit" disabled={!newTodoText.trim()}
                className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                Lägg till
              </button>
            </form>

            {todos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Inga todos ännu.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2">
                    <select
                      value={t.status}
                      onChange={(e) => handleTodoStatus(t.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-full border-0 font-medium ${STATUS_COLOR[t.status]}`}
                    >
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <span className={`flex-1 text-sm ${t.status === "DONE" ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {t.text}
                    </span>
                    {t.dueDate && (
                      <span className="text-xs text-gray-400">
                        {new Date(t.dueDate).toLocaleDateString("sv-SE")}
                      </span>
                    )}
                    <button onClick={() => handleDeleteTodo(t.id)}
                      className="text-xs text-gray-400 hover:text-red-500">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapseSection>

        {/* Filer */}
        <CollapseSection title="Ansökningar & dokument">
          <ProjectFilesSection projectId={project.id} />
        </CollapseSection>
      </div>

      {/* Raderingsdialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Radera möte</h2>
            <p className="text-sm text-gray-600 mb-4">
              Vill du verkligen radera{" "}
              <strong>Möte #{deleteTarget.meetingNumber} — {new Date(deleteTarget.scheduledAt).toLocaleDateString("sv-SE")}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Avbryt
              </button>
              <button onClick={handleDeleteMeeting} disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Raderar…" : "Ja, radera"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Filer (inlined från gamla projects/page.tsx) ──────────────────────────

interface ProjectFile {
  id: string; type: string; fileName: string | null; mimeType: string | null
  sizeBytes: number | null; url: string | null; title: string | null; uploadedAt: string
}

function ProjectFilesSection({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [savingLink, setSavingLink] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/files`).then((r) => r.json()).then(setFiles).finally(() => setLoading(false))
  }, [projectId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch(`/api/projects/${projectId}/files`, { method: "POST", body: fd })
    if (res.ok) { const record = await res.json(); setFiles((prev) => [record, ...prev]) }
    setUploading(false); e.target.value = ""
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault(); setSavingLink(true)
    const res = await fetch(`/api/projects/${projectId}/files/link`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, url: linkUrl }),
    })
    if (res.ok) { const record = await res.json(); setFiles((prev) => [record, ...prev]); setLinkTitle(""); setLinkUrl(""); setShowLinkForm(false) }
    setSavingLink(false)
  }

  async function handleDownload(fileId: string, fileName: string) {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}/download`)
    if (res.ok) { const { url } = await res.json(); const a = document.createElement("a"); a.href = url; a.download = fileName; a.target = "_blank"; a.click() }
  }

  async function handleDelete(fileId: string) {
    await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE" })
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  function fmt(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-end gap-3">
        <button onClick={() => setShowLinkForm(!showLinkForm)} className="text-sm text-[#1D9E75] hover:underline">+ Lägg till länk</button>
        <label className={`text-sm text-[#1D9E75] hover:underline cursor-pointer ${uploading ? "opacity-50" : ""}`}>
          {uploading ? "Laddar upp…" : "+ Ladda upp fil"}
          <input type="file" className="hidden" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {showLinkForm && (
        <form onSubmit={handleAddLink} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Titel *</label>
              <input required value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
              <input required type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={savingLink} className="px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg text-xs font-medium disabled:opacity-50">{savingLink ? "Sparar…" : "Spara"}</button>
            <button type="button" onClick={() => setShowLinkForm(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100">Avbryt</button>
          </div>
        </form>
      )}
      {loading ? <p className="text-sm text-gray-400 text-center py-4">Laddar…</p>
        : files.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Inga filer eller länkar ännu.</p>
        : (
          <div className="divide-y divide-gray-100">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2">
                <div>
                  {f.type === "LINK"
                    ? <a href={f.url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#1D9E75] hover:underline">🔗 {f.title ?? f.url}</a>
                    : <p className="text-sm font-medium text-gray-900">📄 {f.fileName}</p>}
                  <p className="text-xs text-gray-500">{f.sizeBytes ? `${fmt(f.sizeBytes)} · ` : ""}{new Date(f.uploadedAt).toLocaleDateString("sv-SE")}</p>
                </div>
                <div className="flex items-center gap-3">
                  {f.type === "FILE" && f.fileName && (
                    <button onClick={() => handleDownload(f.id, f.fileName!)} className="text-xs text-[#1D9E75] hover:underline">Ladda ner</button>
                  )}
                  <button onClick={() => handleDelete(f.id)} className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
