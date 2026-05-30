"use client"

import { useState } from "react"

interface Agent {
  slug: string
  name: string
  description: string
}

interface AgentWhisper {
  agentName: string
  output: string
  invocationId: string
  timestamp: Date
}

interface Props {
  startupId: string
  sessionId: string
  availableAgents: Agent[]
}

function FeedbackStars({ invocationId }: { invocationId: string }) {
  const [stars, setStars] = useState(0)

  async function rate(n: number) {
    setStars(n)
    await fetch(`/api/agents/invocations/${invocationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: n }),
    })
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => rate(n)}
          className={`text-xs ${n <= stars ? "text-amber-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function AgentPanel({ startupId, sessionId, availableAgents }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [whispers, setWhispers] = useState<AgentWhisper[]>([])

  async function callAgent(slug: string) {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${slug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId, sessionId, userMessage: question }),
      })
      const data = await res.json()
      setWhispers((prev) => [
        {
          agentName: data.agentName,
          output: data.output,
          invocationId: data.invocationId,
          timestamp: new Date(),
        },
        ...prev,
      ])
      setQuestion("")
      setActiveSlug(null)
    } catch (err) {
      console.error("Agent-anrop misslyckades:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Agentväljare */}
      <div className="p-2 border-b border-gray-100">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Specialister
        </div>
        <div className="flex flex-wrap gap-1">
          {availableAgents.map((agent) => (
            <button
              key={agent.slug}
              onClick={() =>
                setActiveSlug(activeSlug === agent.slug ? null : agent.slug)
              }
              title={agent.description}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                activeSlug === agent.slug
                  ? "bg-amber-50 border-amber-400 text-amber-800"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {agent.name}
            </button>
          ))}
          {availableAgents.length === 0 && (
            <p className="text-xs text-gray-400">Inga agenter konfigurerade</p>
          )}
        </div>
      </div>

      {/* Frågeformulär */}
      {activeSlug && (
        <div className="p-2 border-b border-gray-100 bg-amber-50">
          <div className="text-xs text-amber-700 mb-1 font-medium">
            {availableAgents.find((a) => a.slug === activeSlug)?.name}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Vad vill du fråga om?"
            rows={2}
            className="w-full text-xs border border-amber-200 rounded p-2 bg-white resize-none outline-none focus:border-amber-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) callAgent(activeSlug)
            }}
          />
          <button
            onClick={() => callAgent(activeSlug)}
            disabled={!question.trim() || loading}
            className="mt-1 w-full text-xs py-1 bg-amber-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Tänker…" : "Fråga ⌘↵"}
          </button>
        </div>
      )}

      {/* Agentsvar */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {whispers.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Välj en specialist och ställ en fråga
          </p>
        )}
        {whispers.map((whisper) => (
          <div
            key={whisper.invocationId}
            className="bg-white border border-gray-100 rounded-lg p-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-700">
                {whisper.agentName}
              </span>
              <FeedbackStars invocationId={whisper.invocationId} />
            </div>
            <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
              {whisper.output}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
