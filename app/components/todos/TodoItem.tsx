"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type TodoStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "DELETED"

interface Todo {
  id: string
  text: string
  comment: string | null
  status: TodoStatus
  priority: number
  dueDate: string | null
  createdAt: string
  agentSource: string | null
}

interface Props {
  todo: Todo
  isCoach: boolean
  onDelete?: (id: string) => void
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  NOT_STARTED: "Ej påbörjad",
  IN_PROGRESS: "Pågående",
  DONE: "Klar",
  DELETED: "Raderas",
}

const STATUS_COLORS: Record<TodoStatus, string> = {
  NOT_STARTED: "text-gray-500",
  IN_PROGRESS: "text-blue-600",
  DONE: "text-green-600",
  DELETED: "text-red-500",
}

export function TodoItem({ todo, isCoach, onDelete }: Props) {
  const [text, setText] = useState(todo.text)
  const [comment, setComment] = useState(todo.comment ?? "")
  const [status, setStatus] = useState<TodoStatus>(todo.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(
    async (updates: Partial<{ text: string; comment: string; status: TodoStatus }>) => {
      setSaving(true)
      setSaved(false)
      try {
        await fetch(`/api/todos/${todo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        console.error("Autosave misslyckades:", err)
      } finally {
        setSaving(false)
      }
    },
    [todo.id]
  )

  const scheduleAutosave = useCallback(
    (updates: Partial<{ text: string; comment: string }>) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => save(updates), 5000)
    },
    [save]
  )

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  const handleStatusChange = (newStatus: TodoStatus) => {
    setStatus(newStatus)
    save({ status: newStatus })
    if (newStatus === "DELETED" && onDelete) onDelete(todo.id)
  }

  const handleTextChange = (val: string) => {
    setText(val)
    scheduleAutosave({ text: val, comment })
  }

  const handleCommentChange = (val: string) => {
    setComment(val)
    scheduleAutosave({ text, comment: val })
  }

  const isDeleted = status === "DELETED"
  const isDone = status === "DONE"

  return (
    <div
      className={`border rounded-lg p-4 mb-3 transition-opacity ${
        isDeleted ? "opacity-40" : "opacity-100"
      } ${isDone ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <span className="text-xs font-medium text-gray-400 mt-1 min-w-[20px]">
          #{todo.priority}
        </span>

        <div className="flex-1 min-w-0">
          {isCoach ? (
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`w-full text-sm font-medium resize-none border-none outline-none bg-transparent leading-snug ${
                isDone ? "line-through text-gray-400" : "text-gray-900"
              }`}
              rows={2}
              disabled={isDeleted}
            />
          ) : (
            <p
              className={`text-sm font-medium leading-snug ${
                isDone ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {text}
            </p>
          )}

          <textarea
            value={comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Lägg till kommentar..."
            className="w-full text-xs text-gray-500 resize-none border-none outline-none bg-transparent mt-1 leading-relaxed placeholder-gray-300"
            rows={1}
            disabled={isDeleted}
          />

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-gray-400">
              Skapad {new Date(todo.createdAt).toLocaleDateString("sv-SE")}
            </span>
            {todo.dueDate && (
              <span className="text-xs text-gray-400">
                · Senast {new Date(todo.dueDate).toLocaleDateString("sv-SE")}
              </span>
            )}
            {todo.agentSource && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {todo.agentSource.replace("_v1", "")}
              </span>
            )}
            {saving && (
              <span className="text-xs text-gray-400 ml-auto">Sparar...</span>
            )}
            {saved && !saving && (
              <span className="text-xs text-green-500 ml-auto">Sparat ✓</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TodoStatus)}
            className={`text-xs border rounded-full px-2 py-1 cursor-pointer outline-none ${STATUS_COLORS[status]} border-gray-200`}
            disabled={isDeleted && !isCoach}
          >
            {Object.entries(STATUS_LABELS)
              .filter(([key]) => isCoach || key !== "DELETED")
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  )
}
