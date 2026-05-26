"use client"

import { useState, useEffect } from "react"

interface KnowledgeItem {
  id: string
  type: "FILE" | "LINK"
  title: string
  url?: string
  fileName?: string
  mimeType?: string
  keywords: string[]
  createdAt: string
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("title", file.name)
    const res = await fetch("/api/knowledge/file", { method: "POST", body: fd })
    if (res.ok) {
      const item = await res.json()
      setItems((prev) => [item, ...prev])
    }
    setUploading(false)
    e.target.value = ""
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/knowledge/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, url: linkUrl }),
    })
    if (res.ok) {
      const item = await res.json()
      setItems((prev) => [item, ...prev])
      setLinkTitle("")
      setLinkUrl("")
      setShowLinkForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
          <p className="text-gray-500 text-sm">Filer och länkar som agenter använder som kontext</p>
        </div>
        <div className="flex gap-2">
          <label className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer ${uploading ? "opacity-50" : ""}`}>
            {uploading ? "Laddar upp…" : "+ Ladda upp fil"}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Lägg till länk
          </button>
        </div>
      </div>

      {showLinkForm && (
        <form onSubmit={handleAddLink} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-medium text-gray-900">Ny länk</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titel *</label>
              <input
                required
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
              <input
                required
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Sparar…" : "Spara"}
            </button>
            <button type="button" onClick={() => setShowLinkForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">
              Avbryt
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Laddar…</p>
        ) : items.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">
            Inga knowledge-objekt ännu — ladda upp filer eller lägg till länkar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Titel</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Typ</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Nyckelord</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.type === "LINK" && item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-[#1D9E75] hover:underline">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.type === "FILE" ? "📄 Fil" : "🔗 Länk"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.keywords.slice(0, 4).map((kw) => (
                        <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Ta bort
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
