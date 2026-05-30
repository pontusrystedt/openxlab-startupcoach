"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

type Decision = {
  id: string
  text: string
  comment: string | null
  status: string
  priority: number
  agentSource: string | null
  createdAt: string
  startup: { id: string; name: string } | null
}

type Meeting = {
  id: string
  title: string
  meetingDate: string
  klangFileId: string | null
  agentRan: boolean
  decisions: Decision[]
}

type KlangConversation = {
  id: string
  title: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Ej påbörjad" },
  { value: "IN_PROGRESS", label: "Pågår" },
  { value: "DONE", label: "Klar" },
  { value: "ARCHIVED", label: "Arkiverad" },
]

const statusColor: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
}

export default function DecisionList({ meeting: initialMeeting }: { meeting: Meeting }) {
  const router = useRouter()
  const [meeting, setMeeting] = useState(initialMeeting)
  const [decisions, setDecisions] = useState(initialMeeting.decisions)
  const [runningAgent, setRunningAgent] = useState(false)
  const [klangConversations, setKlangConversations] = useState<KlangConversation[]>([])
  const [selectedKlang, setSelectedKlang] = useState("")
  const [linkingKlang, setLinkingKlang] = useState(false)
  const [fetchingKlang, setFetchingKlang] = useState(true)

  // Fetch Klang conversations
  useEffect(() => {
    fetch("/api/klang/conversations")
      .then((r) => r.json())
      .then((data) => {
        setKlangConversations(data.data ?? [])
        setFetchingKlang(false)
      })
      .catch(() => setFetchingKlang(false))
  }, [])

  // Debounce refs for autosave
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const saveDecision = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/decisions/decisions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const updated = await res.json()
        setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)))
      }
    },
    []
  )

  function handleFieldChange(
    id: string,
    field: "text" | "comment" | "status" | "priority",
    value: string | number
  ) {
    // Optimistic update
    setDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )

    if (field === "status") {
      // Immediate save for status
      saveDecision(id, { status: value })
      return
    }

    // Debounce text/comment/priority
    const key = `${id}_${field}`
    clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(() => {
      saveDecision(id, { [field]: value })
    }, 5000)
  }

  async function handleRunAgent() {
    setRunningAgent(true)
    const res = await fetch(`/api/decisions/${meeting.id}/run-agent`, {
      method: "POST",
    })
    if (res.ok) {
      // Poll for results after ~20 seconds
      setTimeout(() => {
        router.refresh()
      }, 20000)
    }
    setRunningAgent(false)
  }

  async function handleLinkKlang(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedKlang) return
    setLinkingKlang(true)
    const res = await fetch(`/api/decisions/${meeting.id}/klang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klangFileId: selectedKlang }),
    })
    const data = await res.json()
    setLinkingKlang(false)
    setMeeting((prev) => ({ ...prev, klangFileId: selectedKlang }))
    if (data.transcriptFetched) {
      setTimeout(() => router.refresh(), 20000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Klang-koppling */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3">Klang.ai-transkription</h2>
        {meeting.klangFileId ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-500">
              Kopplat: <code className="bg-gray-100 px-1 rounded text-xs">{meeting.klangFileId}</code>
            </p>
            {meeting.agentRan ? (
              <p className="text-sm text-green-600">Agenten har körts och genererat beslut.</p>
            ) : (
              <p className="text-sm text-amber-600">Transkript kopplat — agenten körs efter transkription.</p>
            )}
          </div>
        ) : fetchingKlang ? (
          <p className="text-sm text-gray-400">Hämtar möten från Klang.ai…</p>
        ) : (
          <form onSubmit={handleLinkKlang} className="flex gap-2">
            <select
              value={selectedKlang}
              onChange={(e) => setSelectedKlang(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            >
              <option value="">Välj möte från Klang.ai…</option>
              {klangConversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {new Date(c.created_at).toLocaleString("sv-SE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}{" "}
                  — {c.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={linkingKlang || !selectedKlang}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm disabled:opacity-50"
            >
              {linkingKlang ? "Kopplar…" : "Koppla"}
            </button>
          </form>
        )}
      </div>

      {/* Kör agent-knapp */}
      {!meeting.agentRan && meeting.klangFileId && (
        <div className="flex justify-end">
          <button
            onClick={handleRunAgent}
            disabled={runningAgent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {runningAgent ? "Kör agent…" : "Kör agent nu"}
          </button>
        </div>
      )}

      {/* Beslut */}
      <div className="space-y-2">
        {decisions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">
              Inga beslut än.{" "}
              {meeting.klangFileId
                ? "Väntar på agenten…"
                : "Koppla ett Klang.ai-möte för att generera beslut automatiskt."}
            </p>
          </div>
        ) : (
          decisions.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                {/* Priority */}
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={d.priority}
                  onChange={(e) =>
                    handleFieldChange(d.id, "priority", parseInt(e.target.value))
                  }
                  className="w-14 px-2 py-1 border border-gray-200 rounded text-xs text-center"
                  title="Prioritet (1-3)"
                />

                {/* Text */}
                <textarea
                  value={d.text}
                  onChange={(e) => handleFieldChange(d.id, "text", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  rows={2}
                />

                {/* Status */}
                <select
                  value={d.status}
                  onChange={(e) => handleFieldChange(d.id, "status", e.target.value)}
                  className={`px-2 py-1 rounded text-xs border-0 focus:outline-none ${statusColor[d.status] ?? "bg-gray-100"}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <input
                type="text"
                value={d.comment ?? ""}
                onChange={(e) => handleFieldChange(d.id, "comment", e.target.value)}
                placeholder="Kommentar (valfri)…"
                className="w-full px-3 py-1.5 border border-gray-100 rounded-lg text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200"
              />

              {/* Startup badge */}
              {d.startup && (
                <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {d.startup.name}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
