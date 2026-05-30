"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"

export default function SettingsDropdown({
  email,
  totpEnabled,
}: {
  email: string
  totpEnabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <span>Inställningar</span>
        {!totpEnabled && <span className="text-amber-500 ml-1">⚠️</span>}
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
          <Link
            href="/settings/security"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>Tvåfaktorsautentisering</span>
            {!totpEnabled && <span className="text-amber-500 text-xs">⚠️</span>}
          </Link>
          <Link
            href="/settings/klang"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Klang.ai
          </Link>
          <Link
            href="/security"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Datasäkerhet
          </Link>
          <Link
            href="/settings/email"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            E-post (SMTP)
          </Link>
          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
            >
              Logga ut
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
