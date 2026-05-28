"use client"

import { useState, useEffect } from "react"

interface Startup {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  startupId: string | null
  startup: { name: string } | null
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "COACH", startupId: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/org/users").then((r) => r.json()),
      fetch("/api/startups").then((r) => r.json()),
    ]).then(([u, s]) => {
      setUsers(u)
      setStartups(s)
    }).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    const res = await fetch("/api/org/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (res.ok) {
      setUsers((prev) => [...prev, data])
      setForm({ name: "", email: "", role: "COACH", startupId: "" })
      setShowForm(false)
      setSuccessMsg(
        data.emailSent
          ? `Konto skapat och välkomstmail skickat till ${data.email}.`
          : `Konto skapat för ${data.email} — välkomstmailen misslyckades.`
      )
    } else {
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
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !isActive } : u)))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/org/users/${deleteTarget.id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setSuccessMsg(`${deleteTarget.name ?? deleteTarget.email} har raderats.`)
    } else {
      const data = await res.json()
      setError(data.error ?? "Kunde inte radera konto")
    }
    setDeleteTarget(null)
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
          onClick={() => { setShowForm(!showForm); setError(null) }}
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#178a65]"
        >
          + Nytt konto
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
          {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-medium text-gray-900">Skapa konto</h2>
          <p className="text-xs text-gray-500">
            Ett tillfälligt lösenord genereras automatiskt och skickas med välkomstmailen.
            Användaren tvingas byta lösenord och sätta upp TOTP vid första inloggning.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Namn *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Anna Svensson"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-post *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="anna@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Roll</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, startupId: "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              >
                <option value="COACH">Coach</option>
                <option value="CLIENT_ADMIN">Admin</option>
                <option value="ENTREPRENEUR">Grundare</option>
              </select>
            </div>
            {form.role === "ENTREPRENEUR" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bolag *</label>
                <select
                  required
                  value={form.startupId}
                  onChange={(e) => setForm((f) => ({ ...f, startupId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                >
                  <option value="">Välj bolag…</option>
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Skapar…" : "Skapa & skicka välkomstmail"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
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
                <th className="px-4 py-2 text-left font-medium text-gray-600">Namn</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">E-post</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Roll</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Bolag</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">E-post</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Skapad</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-900">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABEL[user.role] ?? user.role}</td>
                  <td className="px-4 py-3 text-gray-500">{user.startup?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {user.emailVerified ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Verifierad</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Väntar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {user.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleToggle(user.id, user.isActive)}
                        className={`text-xs hover:underline ${user.isActive ? "text-orange-500 hover:text-orange-700" : "text-green-600 hover:text-green-800"}`}
                      >
                        {user.isActive ? "Inaktivera" : "Aktivera"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="text-xs text-red-400 hover:text-red-600 hover:underline"
                      >
                        Radera
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Raderingsdialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Radera konto</h2>
            <p className="text-sm text-gray-600 mb-1">
              Vill du verkligen radera{" "}
              <strong>{deleteTarget.name ?? deleteTarget.email}</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-5">
              {deleteTarget.email} · {ROLE_LABEL[deleteTarget.role] ?? deleteTarget.role}
              {deleteTarget.startup ? ` · ${deleteTarget.startup.name}` : ""}
            </p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-5">
              Åtgärden kan inte ångras. Kontot raderas permanent.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Raderar…" : "Ja, radera"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
