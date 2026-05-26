"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function VerifyTotpPage() {
  const { update } = useSession()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch("/api/auth/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    if (res.ok) {
      // Uppdatera JWT-sessionen med totpVerified=true
      await update({ totpVerified: true })
      router.push("/dashboard")
    } else {
      setError("Felaktig kod — försök igen")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Tvåfaktorsautentisering
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Ange koden från din Authenticator-app
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              6-siffrig kod
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-2 px-4 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifierar…" : "Verifiera"}
          </button>
        </form>
      </div>
    </div>
  )
}
