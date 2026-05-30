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
  collections: string[]
  createdAt: string
}

const COLLECTIONS = [
  { id: "general", label: "Generellt (alla agenter)" },
  { id: "post_meeting", label: "Post-mötes-agent" },
  { id: "screening_agent", label: "Screening-agent" },
  { id: "pitch_coach", label: "Pitch Coach" },
  { id: "sales_coach", label: "Sales Coach" },
  { id: "cfo_agent", label: "CFO Agent" },
  { id: "legal_advisor", label: "Legal Advisor" },
  { id: "pricing_coach", label: "Pricing Coach" },
  { id: "decisions_agent", label: "Decisions-agent" },
]

const COLLECTION_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-600",
  post_meeting: "bg-blue-50 text-blue-700",
  screening_agent: "bg-purple-50 text-purple-700",
  pitch_coach: "bg-amber-50 text-amber-700",
  sales_coach: "bg-green-50 text-green-700",
  cfo_agent: "bg-red-50 text-red-700",
  legal_advisor: "bg-yellow-50 text-yellow-700",
  pricing_coach: "bg-indigo-50 text-indigo-700",
  decisions_agent: "bg-pink-50 text-pink-700",
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkCollections, setLinkCollections] = useState<string[]>(["general"])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadCollections, setUploadCollections] = useState<string[]>(["general"])
  const [showUploadCollections, setShowUploadCollections] = useState(false)
  const [filterCollection, setFilterCollection] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  function toggleCollection(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((c) => c !== id) : [...list, id]
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("title", file.name)
    fd.append("collections", JSON.stringify(uploadCollections))
    const res = await fetch("/api/knowledge/file", { method: "POST", body: fd })
    if (res.ok) {
      const item = await res.json()
      setItems((prev) => [item, ...prev])
    }
    setUploading(false)
    setShowUploadCollections(false)
    setUploadCollections(["general"])
    e.target.value = ""
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/knowledge/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, url: linkUrl, collections: linkCollections }),
    })
    if (res.ok) {
      const item = await res.json()
      setItems((prev) => [item, ...prev])
      setLinkTitle("")
      setLinkUrl("")
      setLinkCollections(["general"])
      setShowLinkForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const displayedItems = filterCollection
    ? items.filter((i) => (i.collections ?? ["general"]).includes(filterCollection))
    : items

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
          <p className="text-gray-500 text-sm">Filer och länkar som agenter använder som kontext</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadCollections(!showUploadCollections)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Ladda upp fil
          </button>
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Lägg till länk
          </button>
        </div>
      </div>

      {/* Fil-upload med collections */}
      {showUploadCollections && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-medium text-gray-900">Ladda upp fil</h2>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Samlingar — vilka agenter ska använda detta?
            </p>
            <div className="flex flex-wrap gap-2">
              {COLLECTIONS.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={uploadCollections.includes(c.id)}
                    onChange={() =>
                      setUploadCollections((prev) => toggleCollection(prev, c.id))
                    }
                    className="rounded"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <label
              className={`px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[#188a65] ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploading ? "Laddar upp…" : "Välj fil"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowUploadCollections(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Länkformulär */}
      {showLinkForm && (
        <form
          onSubmit={handleAddLink}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
        >
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
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Samlingar</p>
            <div className="flex flex-wrap gap-2">
              {COLLECTIONS.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={linkCollections.includes(c.id)}
                    onChange={() =>
                      setLinkCollections((prev) => toggleCollection(prev, c.id))
                    }
                    className="rounded"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Sparar…" : "Spara"}
            </button>
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {/* Samlingsfilter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCollection(null)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            filterCollection === null
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
        >
          Alla
        </button>
        {COLLECTIONS.map((c) => (
          <button
            key={c.id}
            onClick={() =>
              setFilterCollection(filterCollection === c.id ? null : c.id)
            }
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterCollection === c.id
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Tabell */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Laddar…</p>
        ) : displayedItems.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">
            Inga knowledge-objekt{filterCollection ? " i denna samling" : ""} ännu.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Titel</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Typ</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Samlingar</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.type === "LINK" && item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1D9E75] hover:underline"
                      >
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
                      {(item.collections ?? ["general"]).map((col) => (
                        <span
                          key={col}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            COLLECTION_COLORS[col] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {COLLECTIONS.find((c) => c.id === col)?.label ?? col}
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
