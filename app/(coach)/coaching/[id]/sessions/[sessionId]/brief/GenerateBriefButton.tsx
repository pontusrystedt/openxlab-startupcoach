"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function GenerateBriefButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/generate-brief`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Något gick fel")
      } else {
        router.refresh()
      }
    } catch {
      setError("Nätverksfel — försök igen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-2.5 bg-slate-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-slate-800"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⟳</span>
            Genererar brief… (~30 sek)
          </span>
        ) : (
          "Generera mötesbrief"
        )}
      </button>
    </div>
  )
}
