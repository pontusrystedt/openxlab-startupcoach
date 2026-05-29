"use client"

import { useState } from "react"

interface Todo {
  id: string
  text: string
  priority: number
  completedAt: string | null
  dueDate: string | null
}

export default function EntrepreneurSessionTodos({ todos: initial }: { todos: Todo[] }) {
  const [todos, setTodos] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  async function toggleComplete(id: string, completedAt: string | null) {
    const status = completedAt ? "NOT_STARTED" : "DONE"
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setTodos((prev) =>
        prev.map((t) => t.id === id ? { ...t, completedAt: completedAt ? null : new Date().toISOString() } : t)
      )
    }
  }

  function startEdit(todo: Todo) {
    setEditing(todo.id)
    setEditText(todo.text)
  }

  async function saveEdit(id: string) {
    const text = editText.trim()
    if (!text) return
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, text } : t))
    }
    setEditing(null)
  }

  return (
    <ol className="space-y-3">
      {todos.map((todo) => (
        <li key={todo.id} className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => toggleComplete(todo.id, todo.completedAt)}
            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              todo.completedAt
                ? "bg-[#1D9E75] border-[#1D9E75]"
                : "border-gray-300 hover:border-[#1D9E75]"
            }`}
          >
            {todo.completedAt && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Text / edit */}
          <div className="flex-1 min-w-0">
            {editing === todo.id ? (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id)
                    if (e.key === "Escape") setEditing(null)
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                />
                <button onClick={() => saveEdit(todo.id)}
                  className="text-xs text-[#1D9E75] hover:underline font-medium">Spara</button>
                <button onClick={() => setEditing(null)}
                  className="text-xs text-gray-400 hover:underline">Avbryt</button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${todo.completedAt ? "line-through text-gray-400" : "text-gray-800"}`}>
                  <span className="text-xs font-medium text-[#1D9E75] mr-1">#{todo.priority}</span>
                  {todo.text}
                </p>
                {!todo.completedAt && (
                  <button onClick={() => startEdit(todo)}
                    className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 hover:underline">
                    Redigera
                  </button>
                )}
              </div>
            )}
            {todo.dueDate && (
              <p className="text-xs text-gray-400 mt-0.5">
                Deadline {new Date(todo.dueDate).toLocaleDateString("sv-SE")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
