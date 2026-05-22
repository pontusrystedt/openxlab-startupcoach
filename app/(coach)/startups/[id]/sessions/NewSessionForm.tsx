"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewSessionForm({
  startupId,
  nextNumber,
}: {
  startupId: string
  nextNumber: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    await fetch(`/api/startups/${startupId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionNumber: nextNumber,
        scheduledAt: form.get("scheduledAt"),
        phase: form.get("phase"),
      }),
    })

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
      >
        + Ny session
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl p-3"
    >
      <div>
        <label className="block text-xs text-gray-500 mb-1">Datum</label>
        <input
          name="scheduledAt"
          type="date"
          required
          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Fas</label>
        <select
          name="phase"
          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
        >
          <option value="COACHING">Coaching</option>
          <option value="SOCIAL">Social</option>
          <option value="IRL_CHECK">IRL-check</option>
          <option value="PRIORITIZATION">Prioritering</option>
          <option value="CLOSING">Avslutning</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-1.5 bg-[#1D9E75] text-white rounded text-sm font-medium disabled:opacity-50"
      >
        {loading ? "…" : "Skapa"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600"
      >
        Avbryt
      </button>
    </form>
  )
}
