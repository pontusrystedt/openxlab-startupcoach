"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function ChangePasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const verified = params.get("verified") === "true"

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Lösenorden matchar inte.")
      return
    }

    setLoading(true)
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Något gick fel.")
      return
    }

    // nextStep: "totp-setup" | "dashboard"
    if (data.nextStep === "totp-setup") {
      router.push("/settings/security")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Välj nytt lösenord
        </h1>

        {verified && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            E-postadressen är verifierad. Välj nu ett nytt lösenord.
          </p>
        )}

        <p className="text-sm text-gray-500 mb-6">
          Minst 12 tecken med både bokstäver och siffror.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nytt lösenord
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bekräfta lösenord
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65] disabled:opacity-50 transition-colors"
          >
            {loading ? "Sparar…" : "Spara lösenord"}
          </button>
        </form>
      </div>
    </div>
  )
}
