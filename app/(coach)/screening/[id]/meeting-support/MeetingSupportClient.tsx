"use client"

import { useState } from "react"

type Props = {
  startupName: string
  questions: string[]
}

export default function MeetingSupportClient({ startupName, questions }: Props) {
  const [current, setCurrent] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  function toggle(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const question = questions[current]
  const isFirst = current === 0
  const isLast = current === questions.length - 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <p className="text-sm text-gray-500">Screening mötessupport</p>
        <h1 className="text-lg font-semibold text-gray-900">{startupName}</h1>
      </div>

      {/* Progress */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                i === current
                  ? "bg-[#1D9E75] text-white"
                  : checked.has(i)
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {checked.size} / {questions.length} besvarade
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Fråga {current + 1} av {questions.length}
          </p>
          <p className="text-2xl font-medium text-gray-900 leading-relaxed mb-8">
            {question?.replace(/^\d+[.)]\s*/, "")}
          </p>

          {/* Checkbox */}
          <button
            onClick={() => toggle(current)}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-colors w-full ${
              checked.has(current)
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                checked.has(current)
                  ? "border-green-500 bg-green-500"
                  : "border-gray-300"
              }`}
            >
              {checked.has(current) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 10">
                  <path
                    d="M1 5l3.5 3.5L11 1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700">
              {checked.has(current) ? "Besvarad" : "Markera som besvarad"}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={isFirst}
          className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 disabled:opacity-40"
        >
          ← Föregående
        </button>
        <button
          onClick={() => toggle(current)}
          className={`px-5 py-3 rounded-xl text-sm font-medium ${
            checked.has(current)
              ? "bg-gray-100 text-gray-600"
              : "bg-[#1D9E75] text-white"
          }`}
        >
          {checked.has(current) ? "Avmarkera" : "Besvarad"}
        </button>
        <button
          onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          disabled={isLast}
          className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 disabled:opacity-40"
        >
          Nästa →
        </button>
      </div>
    </div>
  )
}
