"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

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

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/programs/${params.id}?include=questionDoc`)
      .then((r) => r.json())
      .then((data) => {
        setProgram(data)
        setEditForm({ name: data.name, description: data.description ?? "" })
      })
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleUploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !program) return
    setUploading(true)
    setUploadSuccess(false)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch(`/api/programs/${program.id}/questions`, {
      method: "POST",
      body: fd,
    })
    if (res.ok) {
      setProgram((prev) =>
        prev
          ? {
              ...prev,
              questionDoc: {
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
              },
            }
          : prev
      )
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 4000)
    }
    setUploading(false)
    e.target.value = ""
  }

  async function handleSaveEdit() {
    if (!program) return
    setSaving(true)
    const res = await fetch(`/api/programs/${program.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || null,
        isActive: program.isActive,
      }),
    })
    if (res.ok) {
      setProgram((prev) =>
        prev
          ? { ...prev, name: editForm.name, description: editForm.description || null }
          : prev
      )
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleToggleActive() {
    if (!program) return
    const res = await fetch(`/api/programs/${program.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: program.name,
        description: program.description,
        isActive: !program.isActive,
      }),
    })
    if (res.ok) {
      setProgram((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev))
    }
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>
  if (!program) return <p className="text-center py-16 text-gray-400">Programmet hittades inte.</p>

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link href="/admin/programs" className="hover:text-gray-900">
          Programs
        </Link>
        <span>/</span>
        <span className="text-gray-900">{program.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{program.name}</h1>
          <span
            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              program.isActive
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {program.isActive ? "Aktivt" : "Inaktivt"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleActive}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            {program.isActive ? "Inaktivera" : "Aktivera"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[#1D9E75] hover:underline border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            Redigera
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Redigera program</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Namn *</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Beskrivning</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Sparar…" : "Spara"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      {!editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          {program.description ? (
            <p className="text-sm text-gray-700">{program.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Ingen beskrivning</p>
          )}
          <p className="text-xs text-gray-400">
            Skapat {new Date(program.createdAt).toLocaleDateString("sv-SE")}
            {program._count !== undefined && ` · ${program._count.startups} startups`}
          </p>
        </div>
      )}

      {/* Screeningfrågor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Screeningfrågor</h2>
          <p className="text-sm text-gray-500">
            Frågedokumentet används av screening-agenten vid analys av ansökningar.
          </p>
        </div>

        {program.questionDoc ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {program.questionDoc.fileName}
              </p>
              <p className="text-xs text-gray-400">
                Uppladdad{" "}
                {new Date(program.questionDoc.uploadedAt).toLocaleDateString("sv-SE")}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-400">Inget frågedokument uppladdad</p>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <span>✓</span>
            <span>Frågedokumentet har laddats upp.</span>
          </div>
        )}

        <label
          className={`inline-flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[#188a65] ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {uploading ? "Laddar upp…" : program.questionDoc ? "Ersätt frågedokument" : "Ladda upp frågedokument"}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            disabled={uploading}
            onChange={handleUploadDoc}
          />
        </label>
        <p className="text-xs text-gray-400">Accepterade format: PDF, DOCX</p>
      </div>
    </div>
  )
}
