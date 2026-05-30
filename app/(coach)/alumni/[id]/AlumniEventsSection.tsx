"use client"

import { useState } from "react"

type AlumniEvent = {
  id: string
  type: string
  title: string
  description: string | null
  eventDate: string
  klangFileId: string | null
  createdAt: string
}

const EVENT_TYPES = [
  { value: "MEETING", label: "Möte" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "NOTE", label: "Anteckning" },
  { value: "MILESTONE", label: "Milstolpe" },
]

const typeColors: Record<string, string> = {
  MEETING: "bg-blue-100 text-blue-700",
  PRESENTATION: "bg-purple-100 text-purple-700",
  NOTE: "bg-gray-100 text-gray-600",
  MILESTONE: "bg-amber-100 text-amber-700",
}

type Props = {
  startupId: string
  events: AlumniEvent[]
}

export default function AlumniEventsSection({ startupId, events: initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: "MEETING",
    title: "",
    description: "",
    eventDate: new Date().toISOString().split("T")[0],
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/alumni/${startupId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      const event = await res.json()
      setEvents((prev) => [event, ...prev])
      setShowForm(false)
      setFormData({
        type: "MEETING",
        title: "",
        description: "",
        eventDate: new Date().toISOString().split("T")[0],
      })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Alumni-aktiviteter</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
        >
          {showForm ? "Avbryt" : "+ Ny aktivitet"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Typ</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Datum</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData((p) => ({ ...p, eventDate: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Titel</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              required
              placeholder="Beskriv aktiviteten"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Beskrivning (valfri)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? "Sparar…" : "Spara"}
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga alumni-aktiviteter registrerade.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        typeColors[ev.type] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {EVENT_TYPES.find((t) => t.value === ev.type)?.label ?? ev.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ev.eventDate).toLocaleDateString("sv-SE")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                  {ev.description && (
                    <p className="text-sm text-gray-500 mt-1">{ev.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
