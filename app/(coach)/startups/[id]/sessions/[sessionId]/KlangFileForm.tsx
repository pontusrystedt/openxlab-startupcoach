"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function KlangFileForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    await fetch(`/api/sessions/${sessionId}/klang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klangFileId: form.get("klangFileId") }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        name="klangFileId"
        type="text"
        required
        placeholder="Klang.ai file ID"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "…" : "Koppla"}
      </button>
    </form>
  )
}
