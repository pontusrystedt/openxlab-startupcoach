"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type KlangConversation = {
  id: string
  title: string
  created_at: string
  status: string
}

export default function KlangFileForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<KlangConversation[]>([])
  const [selected, setSelected] = useState("")
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/klang/conversations")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setFetchError(data.error)
        } else {
          setConversations(data.data ?? [])
        }
        setFetching(false)
      })
      .catch(() => { setFetchError("Kunde inte nå Klang.ai"); setFetching(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)

    const res = await fetch(`/api/sessions/${sessionId}/klang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klangFileId: selected }),
    })
    const data = await res.json()

    setLoading(false)

    if (data.transcriptFetched) {
      // Transkriptet hämtades direkt — agenten körs nu, vänta lite och ladda om
      setTimeout(() => router.refresh(), 15000)
      router.refresh()
    } else {
      router.refresh()
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("sv-SE", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {fetching ? (
        <p className="text-sm text-gray-500">Hämtar möten från Klang.ai…</p>
      ) : fetchError ? (
        <p className="text-sm text-red-600">
          {fetchError}{" "}
          {fetchError.includes("nyckel") && (
            <a href="/settings/klang" className="underline">Konfigurera Klang.ai →</a>
          )}
        </p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-gray-500">Inga möten hittades i Klang.ai.</p>
      ) : (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-white"
        >
          <option value="">Välj möte från Klang.ai…</option>
          {conversations.map((c) => (
            <option key={c.id} value={c.id}>
              {formatDate(c.created_at)} — {c.title}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        disabled={loading || !selected}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Kopplar…" : "Koppla möte"}
      </button>
    </form>
  )
}
