"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Program { id: string; name: string }

interface StartupData {
  id: string
  name: string
  sector: string
  contactEmail: string | null
  contactPhone: string | null
  orgNumber: string | null
  registeredAt: Date | null
  postAddress: string | null
  preferredLanguage: string
  founderOwnershipPct: number | null
  activeOwnerPct: number | null
  businessIdea: string | null
  aiStatus: string
  programId: string | null
}

interface Props {
  startup: StartupData
  programs: Program[]
}

export function StartupEditForm({ startup, programs }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name:               startup.name,
    sector:             startup.sector,
    contactEmail:       startup.contactEmail       ?? "",
    contactPhone:       startup.contactPhone       ?? "",
    orgNumber:          startup.orgNumber          ?? "",
    registeredAt:       startup.registeredAt ? startup.registeredAt.toISOString().split("T")[0] : "",
    postAddress:        startup.postAddress        ?? "",
    preferredLanguage:  startup.preferredLanguage  ?? "SWEDISH",
    founderOwnershipPct: startup.founderOwnershipPct?.toString() ?? "",
    activeOwnerPct:     startup.activeOwnerPct?.toString()      ?? "",
    businessIdea:       startup.businessIdea       ?? "",
    aiStatus:           startup.aiStatus           ?? "ON_TRACK",
    programId:          startup.programId          ?? "",
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/startups/${startup.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        founderOwnershipPct: form.founderOwnershipPct !== "" ? Number(form.founderOwnershipPct) : null,
        activeOwnerPct:      form.activeOwnerPct      !== "" ? Number(form.activeOwnerPct)      : null,
        registeredAt:        form.registeredAt        !== "" ? form.registeredAt                : null,
        contactEmail:        form.contactEmail        || null,
        contactPhone:        form.contactPhone        || null,
        orgNumber:           form.orgNumber           || null,
        postAddress:         form.postAddress         || null,
        businessIdea:        form.businessIdea        || null,
        programId:           form.programId           || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      router.refresh()
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
  const labelCls = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Redigera
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Redigera startup</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>

            {/* Grundinfo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Namn *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sektor *</label>
                <input required value={form.sector} onChange={(e) => set("sector", e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Kontakt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>E-post</label>
                <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefon</label>
                <input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Bolagsdata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Org.nummer</label>
                <input value={form.orgNumber} onChange={(e) => set("orgNumber", e.target.value)} className={inputCls} placeholder="556000-0000" />
              </div>
              <div>
                <label className={labelCls}>Registreringsdatum</label>
                <input type="date" value={form.registeredAt} onChange={(e) => set("registeredAt", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Postadress</label>
              <input value={form.postAddress} onChange={(e) => set("postAddress", e.target.value)} className={inputCls} />
            </div>

            {/* Ägarstruktur */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Grundarägande (%)</label>
                <input type="number" min="0" max="100" value={form.founderOwnershipPct}
                  onChange={(e) => set("founderOwnershipPct", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Aktiva ägare (%)</label>
                <input type="number" min="0" max="100" value={form.activeOwnerPct}
                  onChange={(e) => set("activeOwnerPct", e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Affärsidé */}
            <div>
              <label className={labelCls}>Affärsidé</label>
              <textarea rows={3} value={form.businessIdea} onChange={(e) => set("businessIdea", e.target.value)} className={inputCls} />
            </div>

            {/* Inställningar */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Program</label>
                <select value={form.programId} onChange={(e) => set("programId", e.target.value)} className={inputCls}>
                  <option value="">Inget program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Språk</label>
                <select value={form.preferredLanguage} onChange={(e) => set("preferredLanguage", e.target.value)} className={inputCls}>
                  <option value="SWEDISH">Svenska</option>
                  <option value="ENGLISH">Engelska</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>AI-status</label>
                <select value={form.aiStatus} onChange={(e) => set("aiStatus", e.target.value)} className={inputCls}>
                  <option value="ON_TRACK">On track</option>
                  <option value="AT_RISK">At risk</option>
                  <option value="OFF_TRACK">Off track</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "Sparar…" : "Spara ändringar"}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
