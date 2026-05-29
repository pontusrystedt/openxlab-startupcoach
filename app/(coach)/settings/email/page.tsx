"use client"

import { useState } from "react"

export default function EmailSettingsPage() {
  const [testTo, setTestTo] = useState("")
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean
    error?: string
    stage?: string
    config?: { host: string; user: string; port: number }
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
    const data = await res.json()
    setResult(data)
    setTesting(false)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">E-postinställningar</h1>
        <p className="text-sm text-gray-500">
          Testa att SMTP-konfigurationen fungerar. Miljövariablerna{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">SMTP_USER</code>,{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">SMTP_PASS</code> och{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">SMTP_HOST</code> sätts i Coolify.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Skicka testmail</h2>

        <form onSubmit={handleTest} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skicka till
            </label>
            <input
              type="email"
              required
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="din@epost.se"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>

          <button
            type="submit"
            disabled={testing}
            className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50"
          >
            {testing ? "Testar…" : "Skicka testmail"}
          </button>
        </form>

        {result && (
          <div className={`rounded-lg p-4 text-sm ${result.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {result.ok ? (
              <div className="text-green-800">
                <p className="font-medium mb-1">✓ Testmail skickat!</p>
                <p className="text-xs">
                  Via {result.config?.user} → {result.config?.host}:{result.config?.port}
                </p>
                <p className="text-xs mt-1">Kolla inkorgen (och skräpposten) för {testTo}.</p>
              </div>
            ) : (
              <div className="text-red-800">
                <p className="font-medium mb-1">
                  ✗ {result.stage === "verify" ? "Anslutningsfel" : "Kunde inte skicka"}
                </p>
                <p className="text-xs font-mono bg-red-100 rounded p-2 mt-1 break-all">
                  {result.error}
                </p>
                {result.config && (
                  <p className="text-xs mt-2 text-red-600">
                    Konfiguration: {result.config.user} → {result.config.host}:{result.config.port}
                  </p>
                )}
                <div className="mt-3 text-xs text-red-700 space-y-1">
                  <p className="font-medium">Vanliga orsaker:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>SMTP AUTH inte aktiverat för kontot i Microsoft 365 Admin Center</li>
                    <li>MFA aktiverat — kräver app-lösenord (myaccount.microsoft.com → Security → App passwords)</li>
                    <li>Fel lösenord i SMTP_PASS</li>
                    <li>Kontot blockerat av Microsoft pga ovanlig inloggning</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-600">Förväntade miljövariabler i Coolify:</p>
        <p><code>SMTP_HOST</code> = <span className="text-gray-700">smtp.office365.com</span></p>
        <p><code>SMTP_USER</code> = kontots e-postadress (t.ex. services@openxlab.se)</p>
        <p><code>SMTP_PASS</code> = lösenord eller app-lösenord</p>
        <p><code>EMAIL_FROM</code> = avsändaradress (valfritt, default = SMTP_USER)</p>
      </div>
    </div>
  )
}
