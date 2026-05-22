"use client"

import { useState } from "react"

interface Todo {
  id: string
  text: string
  priority: number
  completedAt: Date | null
  dueDate: Date | null
  session: { sessionNumber: number }
  feedback: { stars: number | null; comment: string | null } | null
}

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos)
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null)

  async function toggleComplete(id: string) {
    await fetch(`/api/todos/${id}`, { method: "PATCH" })
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completedAt: t.completedAt ? null : new Date() }
          : t
      )
    )
  }

  async function submitFeedback(
    id: string,
    stars: number,
    comment: string
  ) {
    await fetch(`/api/todos/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars, comment }),
    })
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, feedback: { stars, comment } } : t
      )
    )
    setFeedbackOpen(null)
  }

  const active = todos.filter((t) => !t.completedAt)
  const done = todos.filter((t) => t.completedAt)

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Aktiva</h2>
        <div className="space-y-2">
          {active.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleComplete}
              onFeedback={(id) =>
                setFeedbackOpen(feedbackOpen === id ? null : id)
              }
              feedbackOpen={feedbackOpen === todo.id}
              onSubmitFeedback={submitFeedback}
            />
          ))}
          {active.length === 0 && (
            <p className="text-sm text-gray-400">Inga aktiva todos</p>
          )}
        </div>
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Klara</h2>
          <div className="space-y-2">
            {done.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleComplete}
                onFeedback={(id) =>
                  setFeedbackOpen(feedbackOpen === id ? null : id)
                }
                feedbackOpen={feedbackOpen === todo.id}
                onSubmitFeedback={submitFeedback}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TodoItem({
  todo,
  onToggle,
  onFeedback,
  feedbackOpen,
  onSubmitFeedback,
}: {
  todo: Todo
  onToggle: (id: string) => void
  onFeedback: (id: string) => void
  feedbackOpen: boolean
  onSubmitFeedback: (id: string, stars: number, comment: string) => void
}) {
  const [stars, setStars] = useState(todo.feedback?.stars ?? 0)
  const [comment, setComment] = useState(todo.feedback?.comment ?? "")

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completedAt
              ? "bg-[#1D9E75] border-[#1D9E75]"
              : "border-gray-300 hover:border-[#1D9E75]"
          }`}
        >
          {todo.completedAt && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm ${
              todo.completedAt ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {todo.text}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Session #{todo.session.sessionNumber}
            {todo.dueDate &&
              ` · Deadline ${new Date(todo.dueDate).toLocaleDateString("sv-SE")}`}
          </p>
        </div>
        {todo.completedAt && (
          <button
            onClick={() => onFeedback(todo.id)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {todo.feedback ? "★".repeat(todo.feedback.stars ?? 0) || "Feedback" : "Ge feedback"}
          </button>
        )}
      </div>

      {feedbackOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setStars(n)}
                className={`text-xl ${n <= stars ? "text-amber-400" : "text-gray-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kommentar (valfritt)"
            rows={2}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={() => onSubmitFeedback(todo.id, stars, comment)}
            disabled={stars === 0}
            className="px-3 py-1.5 bg-[#1D9E75] text-white rounded text-sm font-medium disabled:opacity-50"
          >
            Spara
          </button>
        </div>
      )}
    </div>
  )
}
