"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Startup {
  id: string
  name: string
  sector: string
  status: string
  contactEmail: string | null
  contactPhone: string | null
  businessIdea: string | null
  createdAt: string
  program?: {
    id: string
    name: string
    questionDoc?: {
      extractedText: string
      fileName: string
    } | null
  } | null
  _count: { sessions: number }
}

export default function ScreeningPage() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/screening")
      .then((r) => r.json())
      .then(setStartups)
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(startupId: string, newStatus: "COACHING" | "ARCHIVED") {
    setMovingId(startupId)
    const res = await fetch(`/api/startups/${startupId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setStartups((prev) => prev.filter((s) => s.id !== startupId))
      setExpandedId(null)
    }
    setMovingId(null)
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Laddar…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Screening</h1>
        <p className="text-gray-500 text-sm">Startups under utvärdering – besluta om coaching eller avslut</p>
      </div>

      {startups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga startups i screening just nu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {startups.map((s) => {
            const isExpanded = expandedId === s.id
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.sector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      Inkom {new Date(s.createdAt).toLocaleDateString("sv-SE")}
                    </span>
                    {s.program && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {s.program.name}
                      </span>
                    )}
                    <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                    {/* Kontaktinfo & grunddata */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {s.contactEmail && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-0.5">E-post</p>
                          <a href={`mailto:${s.contactEmail}`} className="text-[#1D9E75] hover:underline">
                            {s.contactEmail}
                          </a>
                        </div>
                      )}
                      {s.contactPhone && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Telefon</p>
                          <p className="text-gray-800">{s.contactPhone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Möten</p>
                        <p className="text-gray-800">{s._count.sessions}</p>
                      </div>
                    </div>

                    {/* Affärsidé */}
                    {s.businessIdea && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Affärsidé</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                          {s.businessIdea}
                        </p>
                      </div>
                    )}

                    {/* Frågedokument från program */}
                    {s.program?.questionDoc?.extractedText && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Ansökningsdokument – {s.program.questionDoc.fileName}
                        </p>
                        <div className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg p-3 max-h-60 overflow-y-auto whitespace-pre-wrap">
                          {s.program.questionDoc.extractedText}
                        </div>
                      </div>
                    )}

                    {/* Åtgärder */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <Link
                        href={`/coaching/${s.id}`}
                        className="text-sm text-[#1D9E75] hover:underline"
                      >
                        Öppna startupprofil →
                      </Link>
                      <div className="flex gap-2">
                        <button
                          disabled={movingId === s.id}
                          onClick={() => handleStatusChange(s.id, "ARCHIVED")}
                          className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Avsluta
                        </button>
                        <button
                          disabled={movingId === s.id}
                          onClick={() => handleStatusChange(s.id, "COACHING")}
                          className="px-4 py-2 bg-[#1D9E75] text-white text-sm font-medium rounded-lg hover:bg-[#188a65] disabled:opacity-50"
                        >
                          {movingId === s.id ? "Sparar…" : "Godkänn till coaching →"}
                        </button>
                      </div>
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
