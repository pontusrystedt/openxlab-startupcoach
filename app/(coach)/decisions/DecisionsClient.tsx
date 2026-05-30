"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

type Meeting = {
  id: string
  title: string
  meetingDate: string
  klangFileId: string | null
  agentRan: boolean
  totalDecisions: number
  activeDecisions: number
}

type Decision = {
  id: string
  text: string
  comment: string | null
  status: string
  priority: number
  createdAt: string
  meetingId: string
  startup: { id: string; name: string } | null
  meeting: { id: string; title: string; meetingDate: string } | null
}

type Tab = "meetings" | "active" | "archived"

export default function DecisionsClient() {
  const [tab, setTab] = useState<Tab>("meetings")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === "meetings") {
        const res = await fetch("/api/decisions")
        const data = await res.json()
        setMeetings(data)
      } else if (tab === "active") {
        const res = await fetch("/api/decisions?filter=active")
        const data = await res.json()
        setDecisions(data)
      } else {
        const res = await fetch("/api/decisions?filter=archived")
        const data = await res.json()
        setDecisions(data)
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statusLabel: Record<string, string> = {
    NOT_STARTED: "Ej påbörjad",
    IN_PROGRESS: "Pågår",
    DONE: "Klar",
    ARCHIVED: "Arkiverad",
  }

  const statusColor: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-green-100 text-green-700",
    ARCHIVED: "bg-amber-100 text-amber-700",
  }

  const priorityColor = (p: number) => {
    if (p >= 3) return "bg-red-100 text-red-700"
    if (p === 2) return "bg-orange-100 text-orange-700"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Decisions</h1>
          <p className="text-gray-500 text-sm">Beslut och uppföljningspunkter från coachmöten</p>
        </div>
        <NewMeetingButton onCreated={fetchData} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["meetings", "active", "archived"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[#1D9E75] text-[#1D9E75]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "meetings" ? "Alla möten" : t === "active" ? "Aktiva beslut" : "Arkiverade"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Laddar…</p>
      ) : tab === "meetings" ? (
        <div className="space-y-2">
          {meetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Inga möten ännu. Skapa ett nytt möte för att komma igång.</p>
            </div>
          ) : (
            meetings.map((m) => (
              <Link
                key={m.id}
                href={`/decisions/${m.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(m.meetingDate).toLocaleDateString("sv-SE")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {m.agentRan ? (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      AI klar
                    </span>
                  ) : m.klangFileId ? (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                      Transkript kopplat
                    </span>
                  ) : null}
                  <span className="text-sm text-gray-500">
                    {m.activeDecisions} aktiva / {m.totalDecisions} totalt
                  </span>
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {decisions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                {tab === "active" ? "Inga aktiva beslut." : "Inga arkiverade beslut."}
              </p>
            </div>
          ) : (
            decisions.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{d.text}</p>
                    {d.comment && (
                      <p className="text-xs text-gray-400 mt-1 italic">{d.comment}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {d.startup && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {d.startup.name}
                        </span>
                      )}
                      {d.meeting && (
                        <Link
                          href={`/decisions/${d.meeting.id}`}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          {d.meeting.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(d.priority)}`}>
                      P{d.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[d.status] ?? "bg-gray-100"}`}>
                      {statusLabel[d.status] ?? d.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function NewMeetingButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, meetingDate }),
    })
    setSaving(false)
    setOpen(false)
    setTitle("")
    onCreated()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
      >
        + Nytt möte
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mötetitel"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
      />
      <input
        type="date"
        value={meetingDate}
        onChange={(e) => setMeetingDate(e.target.value)}
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Sparar…" : "Skapa"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
      >
        Avbryt
      </button>
    </form>
  )
}
