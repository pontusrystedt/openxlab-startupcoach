"use client"

import { useState } from "react"

export default function TotpSetupClient({ totpEnabled: initialTotpEnabled }: { totpEnabled: boolean }) {
  const [step, setStep] = useState<"idle" | "scanning" | "confirming" | "done">(
    initialTotpEnabled ? "done" : "idle"
  )
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secretKey, setSecretKey] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Track live status for banner
  const [totpActive, setTotpActive] = useState(initialTotpEnabled)

  async function handleInit() {
    setLoading(true)
    setError(null)
    const res = await fetch("/api/auth/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "init" }),
    })
    if (res.ok) {
      const data = await res.json()
      setQrDataUrl(data.qrDataUrl)
      setSecretKey(data.secret)
      setStep("scanning")
    } else {
      setError("Kunde inte starta TOTP-setup")
    }
    setLoading(false)
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch("/api/auth/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm", code }),
    })
    if (res.ok) {
      setStep("done")
      setTotpActive(true)
    } else {
      setError("Felaktig kod — försök igen")
    }
    setLoading(false)
  }

  async function handleDisable() {
    if (!confirm("Är du säker på att du vill inaktivera TOTP?")) return
    setLoading(true)
    await fetch("/api/auth/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable" }),
    })
    setStep("idle")
    setQrDataUrl(null)
    setSecretKey(null)
    setTotpActive(false)
    setLoading(false)
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Tvåfaktorsautentisering (TOTP)
        </h1>
        <p className="text-sm text-gray-500">
          Öka kontosäkerheten med en Authenticator-app som Google Authenticator eller Authy.
        </p>
      </div>

      {/* Varningsbanner */}
      {!totpActive && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-900">
              Din inloggning är inte fullt skyddad
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Aktivera tvåfaktorsautentisering nedan för att
              skydda ditt konto mot obehörig åtkomst.
            </p>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✓</div>
          <h2 className="font-semibold text-green-900 mb-1">TOTP aktiverat</h2>
          <p className="text-sm text-green-700">
            Tvåfaktorsautentisering är nu aktivt. Du behöver ange en kod från
            din Authenticator-app vid nästa inloggning.
          </p>
          <button
            onClick={handleDisable}
            disabled={loading}
            className="mt-4 text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            Inaktivera TOTP
          </button>
        </div>
      )}

      {step === "idle" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            TOTP är inte aktiverat. Klicka nedan för att börja setup.
          </p>
          <button
            onClick={handleInit}
            disabled={loading}
            className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50"
          >
            {loading ? "Laddar…" : "Aktivera TOTP"}
          </button>
        </div>
      )}

      {step === "scanning" && qrDataUrl && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              1. Skanna QR-koden med din Authenticator-app
            </p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="TOTP QR-kod" className="w-48 h-48" />
            </div>
          </div>
          {secretKey && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Eller ange denna nyckel manuellt:
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                {secretKey}
              </code>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              2. Ange koden från appen för att bekräfta
            </p>
            <form onSubmit={handleConfirm} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50"
              >
                {loading ? "…" : "Bekräfta"}
              </button>
            </form>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
