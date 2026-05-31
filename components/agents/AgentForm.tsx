"use client"

import { useState, useEffect } from "react"
import { AgentAvatar } from "./AgentAvatar"

const AVATAR_STYLES = [
  { id: "lorelei", label: "Lorelei" },
  { id: "avataaars", label: "Avataaars" },
  { id: "micah", label: "Micah" },
  { id: "notionists", label: "Notionists" },
  { id: "personas", label: "Personas" },
]

const TRIGGERS = [
  { id: "ON_DEMAND", label: "Kallas in manuellt av coach" },
  { id: "POST_MEETING", label: "Körs automatiskt efter möte" },
  { id: "DURING_MEETING", label: "Tillgänglig under möte" },
]

const COLLECTIONS = [
  { id: "general", label: "Generellt (alla agenter)" },
  { id: "pitch_coach", label: "Pitch Coach" },
  { id: "sales_coach", label: "Sales Coach" },
  { id: "cfo_agent", label: "CFO Agent" },
  { id: "legal_advisor", label: "Legal Advisor" },
  { id: "pricing_coach", label: "Pricing Coach" },
]

export interface AgentFormData {
  slug: string
  name: string
  title: string
  description: string
  bio: string
  personality: string
  systemPrompt: string
  knowledgeCollection: string
  trigger: string
  maxTokens: number
  avatarStyle: string
  avatarSeed: string
  tier: string
  defaultCollections: string[]
}

interface Props {
  initial?: Partial<AgentFormData>
  isNew?: boolean
  isProcess?: boolean
  isSystemAdmin?: boolean
  onSave: (data: AgentFormData) => Promise<void>
  onCancel: () => void
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

export function AgentForm({ initial = {}, isNew = false, isProcess = false, isSystemAdmin = false, onSave, onCancel }: Props) {
  const [form, setForm] = useState<AgentFormData>({
    slug: "",
    name: "",
    title: "",
    description: "",
    bio: "",
    personality: "",
    systemPrompt: "",
    knowledgeCollection: "general",
    trigger: "ON_DEMAND",
    maxTokens: 1000,
    avatarStyle: "lorelei",
    avatarSeed: "",
    tier: "standard",
    defaultCollections: ["general"],
    ...initial,
  })
  const [availableCollections, setAvailableCollections] = useState<
    Array<{ slug: string; name: string }>
  >([])

  useEffect(() => {
    fetch("/api/knowledge/collections")
      .then((r) => r.json())
      .then((data) => setAvailableCollections(data))
      .catch(() => {})
  }, [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function set(field: keyof AgentFormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNameChange(name: string) {
    set("name", name)
    if (isNew) {
      set(
        "slug",
        name
          .toLowerCase()
          .replace(/å/g, "a")
          .replace(/ä/g, "a")
          .replace(/ö/g, "o")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
      )
    }
  }

  async function handleSubmit() {
    if (!form.name || !form.systemPrompt || !form.description) {
      setError("Namn, beskrivning och systemprompt är obligatoriska.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Något gick fel")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Avatar-förhandsvisning */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <AgentAvatar
          slug={form.slug || "preview"}
          avatarStyle={form.avatarStyle}
          avatarSeed={form.avatarSeed || undefined}
          size={72}
        />
        <div>
          <div className="font-medium text-gray-900">{form.name || "Agentnamn"}</div>
          <div className="text-sm text-gray-500">{form.title || "Titel"}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => set("avatarStyle", s.id)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  form.avatarStyle === s.id
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grunduppgifter */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Grunduppgifter</h3>
        <Field label="Namn *">
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="t.ex. Pitch Coach"
            className="input"
          />
        </Field>
        {isNew && (
          <Field label="Slug *" hint="Används internt — bara a-z, 0-9 och _">
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="t.ex. pitch_coach"
              className="input font-mono text-sm"
            />
          </Field>
        )}
        <Field label="Titel">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="t.ex. Senior Pitchstrateg"
            className="input"
          />
        </Field>
        <Field label="Kort beskrivning *" hint="Visas för coach i agentlistan">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Vad hjälper den här agenten med?"
            className="input"
            rows={2}
          />
        </Field>
      </section>

      {/* Personlighet */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Personlighet och CV</h3>
        <Field
          label="CV / Bakgrund"
          hint="2-3 meningar om agentens erfarenhet. Injiceras i systemprompten."
        >
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Bakgrund, expertis, tidigare erfarenheter..."
            className="input"
            rows={3}
          />
        </Field>
        <Field
          label="Personlighet och kommunikationsstil"
          hint="Hur kommunicerar agenten? Injiceras i systemprompten."
        >
          <textarea
            value={form.personality}
            onChange={(e) => set("personality", e.target.value)}
            placeholder="t.ex. Direkt och konstruktiv. Ställer de obekväma frågorna..."
            className="input"
            rows={2}
          />
        </Field>
      </section>

      {/* Teknisk konfiguration */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Teknisk konfiguration</h3>

        {isProcess ? (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
              Systemprompt
            </p>
            <p className="text-xs text-gray-500 italic">
              Hanteras av OpenX Lab — kontakta oss för ändringar.
            </p>
          </div>
        ) : (
          <Field
            label="Systemprompt *"
            hint="Agentens instruktioner. CV och personlighet läggs till automatiskt."
          >
            <textarea
              value={form.systemPrompt}
              onChange={(e) => set("systemPrompt", e.target.value)}
              placeholder="Du är en erfaren... Analysera... Ge råd om... Svara på svenska."
              className="input font-mono text-xs"
              rows={6}
            />
          </Field>
        )}

        {!isProcess && (
          <>
            <Field label="Trigger — när kan agenten kallas in?">
              <select
                value={form.trigger}
                onChange={(e) => set("trigger", e.target.value)}
                className="input"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Knowledge-samling"
              hint="Vilken samling i Knowledge-repot läser agenten?"
            >
              <select
                value={form.knowledgeCollection}
                onChange={(e) => set("knowledgeCollection", e.target.value)}
                className="input"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        <Field label="Max tokens" hint="Längd på agentens svar. 1000 ≈ 750 ord.">
          <input
            type="number"
            value={form.maxTokens}
            onChange={(e) => set("maxTokens", parseInt(e.target.value))}
            min={200}
            max={4000}
            step={100}
            className="input w-32"
          />
        </Field>

        {availableCollections.length > 0 && (
          <Field
            label="Kunskapssamlingar"
            hint="Generellt är alltid med. Max 2 ytterligare (totalt 3)."
          >
            <div className="flex flex-wrap gap-2">
              {/* General — alltid på, kan ej avbockas */}
              <label className="flex items-center gap-1 text-xs opacity-60 cursor-not-allowed">
                <input type="checkbox" checked readOnly className="rounded" />
                Generellt (alltid)
              </label>
              {availableCollections
                .filter((c) => c.slug !== "general")
                .map((c) => {
                  const selected = form.defaultCollections.filter((s) => s !== "general")
                  const isChecked = form.defaultCollections.includes(c.slug)
                  const maxReached = selected.length >= 2 && !isChecked
                  return (
                    <label
                      key={c.slug}
                      className={`flex items-center gap-1 text-xs ${maxReached ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={maxReached}
                        onChange={() => {
                          const next = isChecked
                            ? form.defaultCollections.filter((s) => s !== c.slug)
                            : [...form.defaultCollections, c.slug]
                          setForm((prev) => ({ ...prev, defaultCollections: next }))
                        }}
                        className="rounded"
                      />
                      {c.name}
                    </label>
                  )
                })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.defaultCollections.filter((s) => s !== "general").length}/2 valda
            </p>
          </Field>
        )}

        {isSystemAdmin && (
          <Field label="Tier" hint="Kontrollerar vilka organisationer som ser agenten.">
            <select
              value={form.tier}
              onChange={(e) => set("tier", e.target.value)}
              className="input w-40"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {saving ? "Sparar…" : isNew ? "Skapa agent" : "Spara ändringar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
