"use client"

import { useEffect, useState } from "react"

export default function KlangSettingsPage() {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [masked, setMasked] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/settings/klang")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured)
        setMasked(d.masked ?? null)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const res = await fetch("/api/settings/klang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    })
    setSaving(false)
    if (res.ok) {
      setMessage({ type: "ok", text: "API-nyckel sparad och webhook registrerad hos Klang.ai." })
      setApiKey("")
      setConfigured(true)
      const data = await res.json().catch(() => ({}))
      setMasked(data.masked ?? null)
      // Re-fetch to get masked key
      fetch("/api/settings/klang")
        .then((r) => r.json())
        .then((d) => setMasked(d.masked ?? null))
    } else {
      const err = await res.json().catch(() => ({}))
      setMessage({ type: "error", text: err.error ?? "Något gick fel." })
    }
  }

  async function handleRemove() {
    if (!confirm("Ta bort Klang.ai API-nyckeln?")) return
    setRemoving(true)
    setMessage(null)
    await fetch("/api/settings/klang", { method: "DELETE" })
    setRemoving(false)
    setConfigured(false)
    setMasked(null)
    setMessage({ type: "ok", text: "API-nyckel borttagen." })
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Klang.ai Integration</h1>
        <p className="text-sm text-gray-500">
          Koppla din Klang.ai API-nyckel för att aktivera mötessynkronisering.
          Nyckeln lagras krypterad och visas aldrig i klartext.
        </p>
      </div>

      {configured === null && (
        <p className="text-sm text-gray-400">Laddar…</p>
      )}

      {configured !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {configured && masked && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">API-nyckel konfigurerad</p>
                <p className="text-xs text-green-700 font-mono mt-0.5">{masked}</p>
              </div>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                {removing ? "Tar bort…" : "Ta bort"}
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {configured ? "Byt API-nyckel" : "Lägg till API-nyckel"}
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="klang_…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>

            {message && (
              <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50 transition-colors"
            >
              {saving ? "Sparar…" : "Spara"}
            </button>
          </form>
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        <p>Hitta din API-nyckel under Inställningar i{" "}
          <a href="https://app.klang.ai" target="_blank" rel="noreferrer" className="underline">
            app.klang.ai
          </a>.
        </p>
      </div>
    </div>
  )
}
