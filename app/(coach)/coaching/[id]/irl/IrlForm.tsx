"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const DIMS = [
  { key: "crl", label: "CRL – Customer Readiness" },
  { key: "trl", label: "TRL – Technology Readiness" },
  { key: "brl", label: "BRL – Business Readiness" },
  { key: "iprl", label: "IPRL – IP Readiness" },
  { key: "frl", label: "FRL – Funding Readiness" },
  { key: "orl", label: "ORL – Organisational Readiness" },
] as const

export default function IrlForm({ startupId }: { startupId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body: Record<string, number | string> = {}
    DIMS.forEach(({ key }) => {
      body[key] = Number(form.get(key))
    })
    body.notes = form.get("notes") as string

    const res = await fetch(`/api/startups/${startupId}/irl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Något gick fel")
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {DIMS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <label className="text-sm text-gray-700 w-44 flex-shrink-0">{label}</label>
          <input
            name={key}
            type="number"
            min={1}
            max={9}
            required
            defaultValue={5}
            className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
          />
          <span className="text-xs text-gray-400">1–9</span>
        </div>
      ))}
      <div>
        <label className="block text-sm text-gray-700 mb-1">Notering</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Sparar…" : "Spara mätning"}
      </button>
    </form>
  )
}
