"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", role: "COACH" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/org/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch("/api/org/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const user = await res.json()
      setUsers((prev) => [...prev, user])
      setForm({ email: "", password: "", role: "COACH" })
      setShowForm(false)
    } else {
      const data = await res.json()
      setError(data.error ?? "Kunde inte skapa konto")
    }
    setSaving(false)
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/org/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !isActive } : u))
      )
    }
  }

  const ROLE_LABEL: Record<string, string> = {
    COACH: "Coach",
    CLIENT_ADMIN: "Admin",
    SYSTEM_ADMIN: "System",
    ENTREPRENEUR: "Grundare",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Användare</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
        >
          + Nytt konto
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-medium text-gray-900">Skapa coach-konto</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-post *</label>
              <input required type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lösenord *</label>
              <input required type="password" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Roll</label>
              <select value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]">
                <option value="COACH">Coach</option>
                <option value="CLIENT_ADMIN">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Skapar…" : "Skapa konto"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">
              Avbryt
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Laddar…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">E-post</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Roll</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Skapad</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABEL[user.role] ?? user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {user.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(user.id, user.isActive)}
                      className={`text-xs hover:underline ${user.isActive ? "text-red-400 hover:text-red-600" : "text-green-600 hover:text-green-800"}`}
                    >
                      {user.isActive ? "Inaktivera" : "Aktivera"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
