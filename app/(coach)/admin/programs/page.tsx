"use client"

import { useState, useEffect } from "react"

interface QuestionDoc {
  fileName: string
  uploadedAt: string
}

interface Program {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  questionDoc: QuestionDoc | null
  _count?: { startups: number }
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "" })
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/programs?include=questionDoc")
      .then((r) => r.json())
      .then(setPrograms)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc || null }),
    })
    if (res.ok) {
      const program = await res.json()
      setPrograms((prev) => [...prev, { ...program, questionDoc: null }])
      setNewName(""); setNewDesc(""); setShowForm(false)
    }
    setSaving(false)
  }

  async function handleToggleActive(program: Program) {
    const res = await fetch(`/api/programs/${program.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: program.name, description: program.description, isActive: !program.isActive }),
    })
    if (res.ok) {
      setPrograms((prev) => prev.map((p) => p.id === program.id ? { ...p, isActive: !p.isActive } : p))
    }
  }

  async function handleSaveEdit(programId: string) {
    const res = await fetch(`/api/programs/${programId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, description: editForm.description || null }),
    })
    if (res.ok) {
      setPrograms((prev) => prev.map((p) => p.id === programId
        ? { ...p, name: editForm.name, description: editForm.description || null }
        : p
      ))
      setEditingId(null)
    }
  }

  async function handleUploadDoc(e: React.ChangeEvent<HTMLInputElement>, programId: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingId(programId)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch(`/api/programs/${programId}/questions`, { method: "POST", body: fd })
    if (res.ok) {
      setPrograms((prev) => prev.map((p) => p.id === programId
        ? { ...p, questionDoc: { fileName: file.name, uploadedAt: new Date().toISOString() } }
        : p
      ))
    }
    setUploadingId(null)
    e.target.value = ""
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Program</h1>
          <p className="text-gray-500 text-sm">Coachingprogram med frågedokument för screening</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#188a65]"
        >
          + Nytt program
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Nytt program</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Namn *</label>
            <input required value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Beskrivning</label>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Sparar…" : "Skapa"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Avbryt
            </button>
          </div>
        </form>
      )}

      {programs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga program skapade ännu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <div key={program.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {editingId === program.id ? (
                <div className="space-y-3">
                  <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
                  <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Beskrivning"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(program.id)}
                      className="px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg text-xs font-medium">Spara</button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600">Avbryt</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-medium text-gray-900">{program.name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${program.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {program.isActive ? "Aktivt" : "Inaktivt"}
                      </span>
                    </div>
                    {program.description && (
                      <p className="text-sm text-gray-500 mb-3">{program.description}</p>
                    )}

                    {/* Frågedokument */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs font-medium text-gray-500">Frågedokument:</span>
                      {program.questionDoc ? (
                        <span className="text-xs text-gray-700">
                          📄 {program.questionDoc.fileName}
                          <span className="text-gray-400 ml-1">
                            (uppladdad {new Date(program.questionDoc.uploadedAt).toLocaleDateString("sv-SE")})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Inget dokument uppladdad</span>
                      )}
                      <label className={`text-xs text-[#1D9E75] hover:underline cursor-pointer ${uploadingId === program.id ? "opacity-50" : ""}`}>
                        {uploadingId === program.id ? "Laddar upp…" : program.questionDoc ? "Ersätt" : "Ladda upp"}
                        <input type="file" className="hidden"
                          accept=".pdf,.docx,.txt"
                          disabled={uploadingId === program.id}
                          onChange={(e) => handleUploadDoc(e, program.id)} />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(program)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      {program.isActive ? "Inaktivera" : "Aktivera"}
                    </button>
                    <button
                      onClick={() => { setEditingId(program.id); setEditForm({ name: program.name, description: program.description ?? "" }) }}
                      className="text-xs text-[#1D9E75] hover:underline"
                    >
                      Redigera
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
