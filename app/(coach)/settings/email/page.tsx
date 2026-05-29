"use client"

import { useState } from "react"

export default function EmailSettingsPage() {
  const [testTo, setTestTo] = useState("")
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean; error?: string; id?: string; from?: string
  } | null>(null)

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    setTesting(true)
    setResult(null)
    const res = await fetch("/api/settings/smtp-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testTo }),
    })
    setResult(await res.json())
    setTesting(false)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">E-postinställningar</h1>
        <p className="text-sm text-gray-500">
          Systemet skickar e-post via <strong>Resend</strong>. Testa att konfigurationen fungerar.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Skicka testmail</h2>
        <form onSubmit={handleTest} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skicka till</label>
            <input
              type="email" required value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="din@epost.se"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          <button type="submit" disabled={testing}
            className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50">
            {testing ? "Testar…" : "Skicka testmail"}
          </button>
        </form>

        {result && (
          <div className={`rounded-lg p-4 text-sm ${result.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {result.ok ? (
              <div className="text-green-800">
                <p className="font-medium mb-1">✓ Testmail skickat!</p>
                <p className="text-xs">Från: {result.from}</p>
                {result.id && <p className="text-xs text-green-600 font-mono">ID: {result.id}</p>}
                <p className="text-xs mt-1">Kolla inkorgen (och skräpposten) för {testTo}.</p>
              </div>
            ) : (
              <div className="text-red-800">
                <p className="font-medium mb-1">✗ Misslyckades</p>
                <p className="text-xs font-mono bg-red-100 rounded p-2 mt-1 break-all">{result.error}</p>
                {result.from && <p className="text-xs mt-2">Avsändare: {result.from}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500 space-y-2">
        <p className="font-medium text-gray-600">Konfiguration (Coolify miljövariabler):</p>
        <p><code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> — API-nyckel från resend.com</p>
        <p><code className="bg-gray-100 px-1 rounded">EMAIL_FROM</code> — avsändaradress, t.ex. <span className="text-gray-700">startupcoach@openxlab.se</span></p>
        <div className="pt-2 border-t border-gray-200">
          <p className="font-medium text-gray-600 mb-1">Kom igång med Resend:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Skapa konto på <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline text-[#1D9E75]">resend.com</a></li>
            <li>Gå till Domains → Add domain → ange <strong>openxlab.se</strong></li>
            <li>Lägg till de DNS-poster Resend visar i Simply.com</li>
            <li>Kopiera API-nyckeln och lägg in som <code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> i Coolify</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
