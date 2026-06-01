"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

export default function AdminDropdown() {
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
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        Admin
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
          <Link
            href="/admin/users"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Användare
          </Link>
          <Link
            href="/admin/programs"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Programs
          </Link>
          <Link
            href="/admin/agents"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Hantera agenter
          </Link>
        </div>
      )}
    </div>
  )
}
