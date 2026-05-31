"use client"

import { useState, useEffect, useRef } from "react"

interface KnowledgeItem {
  id: string
  type: "FILE" | "LINK"
  title: string
  url?: string | null
  fileName?: string | null
  mimeType?: string | null
  keywords: string[]
  collections: string[]
  uploadedBy: string
  createdAt: string
}

interface Collection {
  id: string
  slug: string
  name: string
  description?: string | null
  isGlobal: boolean
  orgId?: string | null
  count: number
}

// ── Hjälpfunktioner ──────────────────────────────────────────────────────

function fileIcon(mimeType?: string | null) {
  if (!mimeType) return "📄"
  if (mimeType.includes("pdf")) return "📕"
  if (mimeType.includes("word") || mimeType.includes("docx")) return "📘"
  if (mimeType.includes("image")) return "🖼️"
  return "📄"
}

// ── Inline samlingsredigering ─────────────────────────────────────────────

function CollectionEditor({
  item,
  collections,
  onSave,
  onClose,
}: {
  item: KnowledgeItem
  collections: Collection[]
  onSave: (id: string, cols: string[]) => Promise<void>
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string[]>(item.collections)
  const [saving, setSaving] = useState(false)

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, selected)
    setSaving(false)
    onClose()
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {collections.map((c) => (
          <label key={c.slug} className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(c.slug)}
              onChange={() => toggle(c.slug)}
              className="rounded"
            />
            {c.name}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1 bg-[#1D9E75] text-white text-xs rounded-lg disabled:opacity-50"
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 border border-gray-200 text-xs text-gray-600 rounded-lg"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}

// ── Knowledge-kort ────────────────────────────────────────────────────────

function KnowledgeCard({
  item,
  collections,
  onDelete,
  onUpdateCollections,
}: {
  item: KnowledgeItem
  collections: Collection[]
  onDelete: (id: string) => void
  onUpdateCollections: (id: string, cols: string[]) => Promise<void>
}) {
  const [editingCollections, setEditingCollections] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Radera "${item.title}"?`)) return
    setDeleting(true)
    await fetch(`/api/knowledge/${item.id}`, { method: "DELETE" })
    onDelete(item.id)
  }

  const colMap = Object.fromEntries(collections.map((c) => [c.slug, c.name]))

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">
          {item.type === "LINK" ? "🔗" : fileIcon(item.mimeType)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {item.type === "LINK" && item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="text-[#1D9E75] hover:underline">{item.title}</a>
                ) : item.title}
              </p>
              {item.fileName && item.fileName !== item.title && (
                <p className="text-xs text-gray-400 truncate">{item.fileName}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setEditingCollections(!editingCollections)}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Samlingar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Radera
              </button>
            </div>
          </div>

          {/* Samlingar-badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {item.collections.map((col) => (
              <span key={col}
                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {colMap[col] ?? col}
              </span>
            ))}
          </div>

          {/* Nyckelord */}
          {item.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.keywords.slice(0, 5).map((kw) => (
                <span key={kw}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {kw}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-1.5">
            {new Date(item.createdAt).toLocaleDateString("sv-SE")}
          </p>
        </div>
      </div>

      {editingCollections && (
        <CollectionEditor
          item={item}
          collections={collections}
          onSave={onUpdateCollections}
          onClose={() => setEditingCollections(false)}
        />
      )}
    </div>
  )
}

// ── Upload-panel ──────────────────────────────────────────────────────────

type PanelMode = "idle" | "file-step1" | "file-step2" | "link"

function UploadPanel({
  collections,
  onUploaded,
}: {
  collections: Collection[]
  onUploaded: (item: KnowledgeItem) => void
}) {
  const [mode, setMode] = useState<PanelMode>("idle")
  // Fil-steg 1 → 2
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggested, setSuggested] = useState<string[]>([])
  const [fileCollections, setFileCollections] = useState<string[]>(["general"])
  const [fileTitle, setFileTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  // Länk
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [linkCollections, setLinkCollections] = useState<string[]>(["general"])
  const [savingLink, setSavingLink] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setFileTitle(file.name.replace(/\.[^/.]+$/, ""))
    setMode("file-step1")
    setAnalyzing(true)

    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/knowledge/suggest", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        setSuggested(data.suggested ?? ["general"])
        setFileCollections(data.suggested ?? ["general"])
      }
    } catch {
      setFileCollections(["general"])
    }
    setAnalyzing(false)
    setMode("file-step2")
  }

  function toggleFileCol(slug: string) {
    setFileCollections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", selectedFile)
    fd.append("title", fileTitle)
    fd.append("collections", JSON.stringify(fileCollections))
    const res = await fetch("/api/knowledge/file", { method: "POST", body: fd })
    if (res.ok) {
      const item = await res.json()
      onUploaded(item)
      setUploadSuccess(true)
      setTimeout(() => {
        setUploadSuccess(false)
        setMode("idle")
        setSelectedFile(null)
        setFileTitle("")
        setFileCollections(["general"])
        setSuggested([])
        if (fileInputRef.current) fileInputRef.current.value = ""
      }, 2000)
    }
    setUploading(false)
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    setSavingLink(true)
    const res = await fetch("/api/knowledge/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, url: linkUrl, collections: linkCollections }),
    })
    if (res.ok) {
      const item = await res.json()
      onUploaded(item)
      setLinkUrl(""); setLinkTitle(""); setLinkCollections(["general"])
      setMode("idle")
    }
    setSavingLink(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h2 className="font-medium text-gray-900 text-sm">Lägg till</h2>

      <div className="flex gap-2">
        <label className="flex-1 px-3 py-2 text-center text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700 font-medium">
          📄 Ladda upp fil
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
        </label>
        <button
          onClick={() => setMode(mode === "link" ? "idle" : "link")}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
        >
          🔗 Länk
        </button>
      </div>

      {/* Steg 1: Analyserar */}
      {mode === "file-step1" && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="animate-spin">⟳</span>
          AI analyserar dokumentet…
        </div>
      )}

      {/* Steg 2: Granska och bekräfta */}
      {mode === "file-step2" && selectedFile && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titel</label>
            <input
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              {analyzing ? "Analyserar samlingar…" : (
                <>
                  AI föreslår:{" "}
                  <span className="text-[#1D9E75]">
                    {suggested.map((s) =>
                      collections.find((c) => c.slug === s)?.name ?? s
                    ).join(", ")}
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <label key={c.slug} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fileCollections.includes(c.slug)}
                    onChange={() => toggleFileCol(c.slug)}
                    className="rounded"
                  />
                  {c.name}
                  {suggested.includes(c.slug) && (
                    <span className="text-[#1D9E75]">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {uploadSuccess ? (
            <p className="text-sm text-green-600">✓ Uppladdad!</p>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {uploading ? "Laddar upp…" : "Ladda upp"}
            </button>
          )}
        </div>
      )}

      {/* Länkformulär */}
      {mode === "link" && (
        <form onSubmit={handleAddLink} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
            <input
              required type="url" value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titel *</label>
            <input
              required value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Samlingar</p>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <label key={c.slug} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkCollections.includes(c.slug)}
                    onChange={() => setLinkCollections((prev) =>
                      prev.includes(c.slug) ? prev.filter((s) => s !== c.slug) : [...prev, c.slug]
                    )}
                    className="rounded"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit" disabled={savingLink}
            className="w-full px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {savingLink ? "Sparar…" : "Lägg till länk"}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Huvudsida ─────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newColName, setNewColName] = useState("")
  const [newColDesc, setNewColDesc] = useState("")
  const [savingCol, setSavingCol] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/knowledge").then((r) => r.json()),
      fetch("/api/knowledge/collections").then((r) => r.json()),
    ]).then(([itemsData, colsData]) => {
      setItems(itemsData)
      setCollections(colsData)
    }).finally(() => setLoading(false))
  }, [])

  async function handleUpdateCollections(id: string, cols: string[]) {
    await fetch(`/api/knowledge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collections: cols }),
    })
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, collections: cols } : i))
    // Uppdatera count
    setCollections((prev) => prev.map((c) => ({
      ...c,
      count: items.filter((i) => (i.id === id ? cols : i.collections).includes(c.slug)).length,
    })))
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault()
    setSavingCol(true)
    const res = await fetch("/api/knowledge/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newColName, description: newColDesc }),
    })
    if (res.ok) {
      const col = await res.json()
      setCollections((prev) => [...prev, col])
      setNewColName(""); setNewColDesc(""); setShowNewCollection(false)
    }
    setSavingCol(false)
  }

  function handleUploaded(item: KnowledgeItem) {
    setItems((prev) => [item, ...prev])
    // Uppdatera counts
    setCollections((prev) => prev.map((c) => ({
      ...c,
      count: c.count + (item.collections.includes(c.slug) ? 1 : 0),
    })))
  }

  const filtered = items.filter((item) => {
    const matchesCollection = !activeCollection || item.collections.includes(activeCollection)
    const matchesSearch = !search || (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
    )
    return matchesCollection && matchesSearch
  })

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  return (
    <div className="flex gap-6 min-h-0">
      {/* VÄNSTER: Samlingsfilter */}
      <div className="w-64 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Samlingar</h2>
          <button
            onClick={() => setShowNewCollection(!showNewCollection)}
            className="text-xs text-[#1D9E75] hover:underline"
          >
            + Ny
          </button>
        </div>

        {showNewCollection && (
          <form onSubmit={handleCreateCollection} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
            <input
              required value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="Namn *"
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-gray-400"
            />
            <input
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              placeholder="Beskrivning"
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-gray-400"
            />
            <div className="flex gap-1">
              <button type="submit" disabled={savingCol}
                className="px-2 py-1 bg-[#1D9E75] text-white text-xs rounded disabled:opacity-50">
                {savingCol ? "…" : "Skapa"}
              </button>
              <button type="button" onClick={() => setShowNewCollection(false)}
                className="px-2 py-1 border border-gray-200 text-xs text-gray-600 rounded">
                Avbryt
              </button>
            </div>
          </form>
        )}

        <div className="space-y-0.5">
          <button
            onClick={() => setActiveCollection(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
              !activeCollection ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>Alla</span>
            <span className="text-xs opacity-60">{items.length}</span>
          </button>

          {collections.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">
                Globala
              </p>
              {collections.filter((c) => c.isGlobal).map((c) => (
                <button key={c.slug}
                  onClick={() => setActiveCollection(activeCollection === c.slug ? null : c.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    activeCollection === c.slug ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">🌐 {c.name}</span>
                  <span className="text-xs opacity-60 ml-1 flex-shrink-0">{c.count}</span>
                </button>
              ))}

              {collections.some((c) => !c.isGlobal) && (
                <>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">
                    Era samlingar
                  </p>
                  {collections.filter((c) => !c.isGlobal).map((c) => (
                    <button key={c.slug}
                      onClick={() => setActiveCollection(activeCollection === c.slug ? null : c.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                        activeCollection === c.slug ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="truncate">🏢 {c.name}</span>
                      <span className="text-xs opacity-60 ml-1 flex-shrink-0">{c.count}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* MITTEN: Items */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
          <span className="text-sm text-gray-400">
            {filtered.length} {filtered.length === 1 ? "dokument" : "dokument"}
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök på titel eller nyckelord…"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
        />

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">
              {search || activeCollection ? "Inga dokument matchar filtret." : "Inga dokument ännu — ladda upp filer eller lägg till länkar."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                collections={collections}
                onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
                onUpdateCollections={handleUpdateCollections}
              />
            ))}
          </div>
        )}
      </div>

      {/* HÖGER: Upload-panel */}
      <div className="w-72 flex-shrink-0">
        <UploadPanel collections={collections} onUploaded={handleUploaded} />
      </div>
    </div>
  )
}
