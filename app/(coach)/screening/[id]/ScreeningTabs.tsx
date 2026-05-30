"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type ScreeningResponse = {
  id: string
  question: string
  aiAnswer: string | null
  coachEdit: string | null
  order: number
}

type ScreeningAnalysis = {
  id: string
  strengths: string
  risks: string
  recommendation: string
  reasoning: string
  coachFeedback: string | null
  coachStars: number | null
}

type AlumniEvent = never // not used here

type Props = {
  startupId: string
  screeningOutcome: string
  responses: ScreeningResponse[]
  analysis: ScreeningAnalysis | null
  klangFileId: string | null
  programQuestions: string | null
}

type Tab = "responses" | "analysis" | "meeting"

export default function ScreeningTabs({
  startupId,
  screeningOutcome,
  responses: initialResponses,
  analysis: initialAnalysis,
  klangFileId: initialKlangFileId,
  programQuestions,
}: Props) {
  const [tab, setTab] = useState<Tab>("responses")
  const [responses, setResponses] = useState(initialResponses)
  const [analysis, setAnalysis] = useState(initialAnalysis)
  const [klangFileId, setKlangFileId] = useState(initialKlangFileId)
  const [runningAgent, setRunningAgent] = useState(false)
  const [approvingReject, setApprovingReject] = useState<"approve" | "reject" | null>(null)
  const [outcome, setOutcome] = useState(screeningOutcome)

  const [klangConversations, setKlangConversations] = useState<
    Array<{ id: string; title: string; created_at: string }>
  >([])
  const [selectedKlang, setSelectedKlang] = useState("")
  const [linkingKlang, setLinkingKlang] = useState(false)
  const [fetchingKlang, setFetchingKlang] = useState(true)

  useEffect(() => {
    fetch("/api/klang/conversations")
      .then((r) => r.json())
      .then((data) => {
        setKlangConversations(data.data ?? [])
        setFetchingKlang(false)
      })
      .catch(() => setFetchingKlang(false))
  }, [])

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function handleResponseEdit(id: string, value: string) {
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, coachEdit: value } : r))
    )
    clearTimeout(debounceTimers.current[id])
    debounceTimers.current[id] = setTimeout(async () => {
      await fetch(`/api/screening/${startupId}/responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachEdit: value }),
      })
    }, 5000)
  }

  async function handleRunAgent() {
    setRunningAgent(true)
    await fetch(`/api/screening/${startupId}/run-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    setRunningAgent(false)
    // Reload after ~20 seconds
    setTimeout(() => window.location.reload(), 20000)
  }

  async function handleFeedback(field: "coachFeedback" | "coachStars", value: string | number) {
    if (!analysis) return
    setAnalysis((prev) => prev ? { ...prev, [field]: value } : prev)
    await fetch(`/api/screening/${startupId}/analysis/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
  }

  async function handleApprove() {
    setApprovingReject("approve")
    const res = await fetch(`/api/screening/${startupId}/approve`, { method: "POST" })
    if (res.ok) setOutcome("APPROVED")
    setApprovingReject(null)
  }

  async function handleReject() {
    setApprovingReject("reject")
    const res = await fetch(`/api/screening/${startupId}/reject`, { method: "POST" })
    if (res.ok) setOutcome("REJECTED")
    setApprovingReject(null)
  }

  async function handleLinkKlang(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedKlang) return
    setLinkingKlang(true)
    await fetch(`/api/screening/${startupId}/klang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klangFileId: selectedKlang }),
    })
    setKlangFileId(selectedKlang)
    setLinkingKlang(false)
  }

  let strengths: string[] = []
  let risks: string[] = []
  try {
    if (analysis?.strengths) strengths = JSON.parse(analysis.strengths)
    if (analysis?.risks) risks = JSON.parse(analysis.risks)
  } catch {
    // keep empty
  }

  const recommendationColor = {
    APPROVE: "bg-green-100 text-green-700",
    REJECT: "bg-red-100 text-red-700",
    UNCERTAIN: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["responses", "analysis", "meeting"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[#1D9E75] text-[#1D9E75]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "responses"
              ? "Screeningfrågor"
              : t === "analysis"
              ? "AI-analys"
              : "Möte"}
          </button>
        ))}
      </div>

      {/* Screeningfrågor */}
      {tab === "responses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {responses.length > 0
                ? `${responses.length} frågor`
                : "Inga frågesvar ännu"}
            </p>
            <div className="flex gap-2">
              {programQuestions && (
                <Link
                  href={`/screening/${startupId}/meeting-support`}
                  target="_blank"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  Mötessupport
                </Link>
              )}
              <button
                onClick={handleRunAgent}
                disabled={runningAgent || !klangFileId}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {runningAgent ? "Kör agent…" : "Kör screening-AI"}
              </button>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                Koppla ett screeningmöte och kör AI-analysen för att se svar.
              </p>
            </div>
          ) : (
            responses.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
              >
                <p className="text-sm font-medium text-gray-800">
                  {r.order}. {r.question}
                </p>
                {r.aiAnswer && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {r.aiAnswer}
                  </p>
                )}
                <textarea
                  value={r.coachEdit ?? ""}
                  onChange={(e) => handleResponseEdit(r.id, e.target.value)}
                  placeholder="Din redigering (sparas automatiskt)…"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* AI-analys */}
      {tab === "analysis" && (
        <div className="space-y-4">
          {!analysis ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Ingen AI-analys ännu. Kör screening-AI från fliken Screeningfrågor.</p>
            </div>
          ) : (
            <>
              {/* Rekommendation */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Rekommendation</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      recommendationColor[
                        analysis.recommendation as keyof typeof recommendationColor
                      ] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {analysis.recommendation === "APPROVE"
                      ? "Godkänn"
                      : analysis.recommendation === "REJECT"
                      ? "Avvisa"
                      : "Osäker"}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{analysis.reasoning}</p>
              </div>

              {/* Styrkor */}
              {strengths.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Styrkor</h3>
                  <ul className="space-y-1">
                    {strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risker */}
              {risks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Risker</h3>
                  <ul className="space-y-1">
                    {risks.map((r, i) => (
                      <li key={i} className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coach feedback */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-medium text-gray-900">Din bedömning</h3>

                {/* Stars */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleFeedback("coachStars", star)}
                      className={`text-2xl ${
                        analysis.coachStars && star <= analysis.coachStars
                          ? "text-amber-400"
                          : "text-gray-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={analysis.coachFeedback ?? ""}
                  onChange={(e) => handleFeedback("coachFeedback", e.target.value)}
                  placeholder="Din feedback på AI-analysen…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                />
              </div>

              {/* Godkänn/Avvisa */}
              {outcome === "PENDING" && (
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={handleReject}
                    disabled={!!approvingReject}
                    className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {approvingReject === "reject" ? "Avvisar…" : "Avvisa"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={!!approvingReject}
                    className="px-4 py-2 bg-[#1D9E75] text-white text-sm font-medium rounded-lg hover:bg-[#178a65] disabled:opacity-50"
                  >
                    {approvingReject === "approve" ? "Godkänner…" : "Godkänn till coaching"}
                  </button>
                </div>
              )}
              {outcome === "APPROVED" && (
                <p className="text-sm text-green-600 text-right font-medium">Godkänd till coaching</p>
              )}
              {outcome === "REJECTED" && (
                <p className="text-sm text-red-600 text-right font-medium">Avvisad</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Möte */}
      {tab === "meeting" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">Screeningmöte (Klang.ai)</h2>
          {klangFileId ? (
            <div>
              <p className="text-sm text-gray-500">
                Kopplat: <code className="bg-gray-100 px-1 rounded text-xs">{klangFileId}</code>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Transkriptionen används av screening-AI:n.
              </p>
            </div>
          ) : fetchingKlang ? (
            <p className="text-sm text-gray-400">Hämtar möten från Klang.ai…</p>
          ) : (
            <form onSubmit={handleLinkKlang} className="flex gap-2">
              <select
                value={selectedKlang}
                onChange={(e) => setSelectedKlang(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              >
                <option value="">Välj möte från Klang.ai…</option>
                {klangConversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {new Date(c.created_at).toLocaleString("sv-SE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    — {c.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={linkingKlang || !selectedKlang}
                className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm disabled:opacity-50"
              >
                {linkingKlang ? "Kopplar…" : "Koppla"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
