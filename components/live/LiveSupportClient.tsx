"use client"

import { useState, useRef } from "react"
import { AgentPanel } from "@/components/agents/AgentPanel"

type Category = "followup" | "irl_gap" | "explore" | "specialist" | "all"

const CATEGORY_CONFIG = {
  followup: { icon: "↩", label: "Uppföljning", color: "text-blue-600" },
  irl_gap: { icon: "⬡", label: "IRL-gap", color: "text-amber-600" },
  explore: { icon: "◈", label: "Utforska", color: "text-green-600" },
  specialist: { icon: "★", label: "Specialist", color: "text-purple-600" },
} as const

interface Question {
  id: string
  text: string
  category: string
  agentSlug: string | null
  isChecked: boolean
  priority: number
}

interface SessionData {
  id: string
  sessionNumber: number
  startupId: string
  liveNotes: string | null
  startup: { name: string }
}

interface AgentData {
  slug: string
  name: string
  title: string | null
  description: string
  avatarStyle: string
  avatarSeed: string | null
  trigger: string
}

interface Props {
  session: SessionData
  initialQuestions: Question[]
  availableAgents: AgentData[]
}

function QuestionRow({
  question,
  onToggle,
}: {
  question: Question
  onToggle: (id: string, checked: boolean) => void
}) {
  const config =
    CATEGORY_CONFIG[question.category as keyof typeof CATEGORY_CONFIG] ??
    CATEGORY_CONFIG.explore

  return (
    <button
      onClick={() => onToggle(question.id, !question.isChecked)}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        question.isChecked
          ? "bg-gray-50 border-gray-100 opacity-50"
          : "bg-white border-gray-200 hover:border-gray-300 active:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
            question.isChecked ? "bg-gray-900 border-gray-900" : "border-gray-300"
          }`}
        >
          {question.isChecked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div
            className={`text-sm leading-snug ${
              question.isChecked ? "line-through text-gray-400" : "text-gray-900"
            }`}
          >
            {question.text}
          </div>
          <div className={`text-xs mt-1 ${config.color}`}>
            {config.icon} {config.label}
            {question.agentSlug && ` · ${question.agentSlug.replace(/_/g, " ")}`}
          </div>
        </div>
      </div>
    </button>
  )
}

export function LiveSupportClient({ session, initialQuestions, availableAgents }: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [filter, setFilter] = useState<Category>("all")
  const [notes, setNotes] = useState(session.liveNotes ?? "")
  const [showAgents, setShowAgents] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  async function toggleQuestion(questionId: string, isChecked: boolean) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isChecked } : q))
    )
    await fetch(`/api/sessions/${session.id}/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked }),
    })
  }

  function handleNotesChange(text: string) {
    setNotes(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSavingNotes(true)
      await fetch(`/api/sessions/${session.id}/live-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveNotes: text }),
      })
      setSavingNotes(false)
    }, 3000)
  }

  const filteredQuestions =
    filter === "all" ? questions : questions.filter((q) => q.category === filter)

  const checkedCount = questions.filter((q) => q.isChecked).length

  const panelAgents = availableAgents.map((a) => ({
    slug: a.slug,
    name: a.name,
    title: a.title,
    description: a.description,
    avatarStyle: a.avatarStyle,
    avatarSeed: a.avatarSeed,
  }))

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      {/* Header — sticky */}
      <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {session.startup.name}
            </div>
            <div className="text-xs text-gray-500">
              Session #{session.sessionNumber} · {checkedCount}/{questions.length} frågor
            </div>
          </div>
          <button
            onClick={() => setShowAgents(!showAgents)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              showAgents
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {showAgents ? "Stäng specialist" : "Specialist ★"}
          </button>
        </div>

        {/* Kategori-filter */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {(["all", "followup", "irl_gap", "explore", "specialist"] as Category[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${
                  filter === cat
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {cat === "all"
                  ? "Alla"
                  : cat === "followup"
                    ? "↩ Uppföljning"
                    : cat === "irl_gap"
                      ? "⬡ IRL-gap"
                      : cat === "explore"
                        ? "◈ Utforska"
                        : "★ Specialist"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Agentpanel */}
      {showAgents && (
        <div className="border-b border-amber-100 bg-amber-50 p-4 max-h-80 overflow-y-auto">
          <AgentPanel
            startupId={session.startupId}
            sessionId={session.id}
            availableAgents={panelAgents}
          />
        </div>
      )}

      {/* Frågelista */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {filteredQuestions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {questions.length === 0
              ? "Generera en mötesbrief för att se förberedda frågor."
              : "Inga frågor i denna kategori."}
          </p>
        ) : (
          filteredQuestions.map((q) => (
            <QuestionRow key={q.id} question={q} onToggle={toggleQuestion} />
          ))
        )}
      </div>

      {/* Snabbnoteringar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Snabbnoteringar
          </span>
          {savingNotes && <span className="text-xs text-gray-400">Sparar…</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Skriv fritt under mötet…"
          className="w-full text-sm border-none outline-none bg-transparent resize-none text-gray-700 placeholder-gray-300"
          rows={3}
        />
      </div>
    </div>
  )
}
