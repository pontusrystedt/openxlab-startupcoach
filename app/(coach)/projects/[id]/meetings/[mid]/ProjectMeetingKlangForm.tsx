"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type KlangConversation = { id: string; title: string; created_at: string }

export default function ProjectMeetingKlangForm({
  projectId,
  meetingId,
}: {
  projectId: string
  meetingId: string
}) {
  const router = useRouter()
  const [conversations, setConversations] = useState<KlangConversation[]>([])
  const [selected, setSelected] = useState("")
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    fetch("/api/klang/conversations")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setFetchError(data.error)
        else setConversations(data.data ?? [])
        setFetching(false)
      })
      .catch(() => { setFetchError("Kunde inte nå Klang.ai"); setFetching(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLinking(true)

    const res = await fetch(`/api/projects/${projectId}/meetings/${meetingId}/klang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klangFileId: selected }),
    })
    const data = await res.json()
    setLinking(false)

    if (res.ok) {
      if (data.transcriptFetched) {
        // Transkript hämtat direkt — ladda om direkt och igen efter en stund (för AI-analysen)
        router.refresh()
        setTimeout(() => router.refresh(), 20000)
      } else {
        router.refresh()
      }
    }
  }

  if (fetching) return <p className="text-sm text-gray-500">Hämtar möten från Klang.ai…</p>

  if (fetchError) return (
    <p className="text-sm text-red-600">
      {fetchError}{" "}
      {fetchError.includes("nyckel") && (
        <a href="/settings/klang" className="underline">Konfigurera Klang.ai →</a>
      )}
    </p>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {conversations.length === 0 ? (
        <p className="text-sm text-gray-500">Inga möten hittades i Klang.ai.</p>
      ) : (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-white"
        >
          <option value="">Välj möte från Klang.ai…</option>
          {conversations.map((c) => (
            <option key={c.id} value={c.id}>
              {new Date(c.created_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })} — {c.title}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        disabled={linking || !selected}
        className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50 self-start"
      >
        {linking ? "Kopplar…" : "Koppla möte"}
      </button>
    </form>
  )
}
