"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyEmailRedirect() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")
    if (token) {
      router.replace(`/api/auth/verify-email?token=${token}`)
    }
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm text-center">
        <div className="text-3xl mb-4">✉️</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Verifierar e-postadress…
        </h1>
        <p className="text-sm text-gray-500">Ett ögonblick.</p>
      </div>
    </div>
  )
}
