"use client"

import { useState } from "react"
import { TodoItem } from "./TodoItem"

interface Todo {
  id: string
  text: string
  comment: string | null
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "DELETED"
  priority: number
  dueDate: string | null
  createdAt: string
  agentSource: string | null
}

interface Props {
  todos: Todo[]
  isCoach: boolean
  sessionInfo?: {
    sessionNumber: number
    scheduledAt: string
    startupName: string
  }
}

export function TodoList({ todos: initialTodos, isCoach, sessionInfo }: Props) {
  const [todos, setTodos] = useState(initialTodos)

  const handleDelete = (id: string) => {
    if (!isCoach) {
      setTodos((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const visibleTodos = isCoach
    ? todos
    : todos.filter((t) => t.status !== "DELETED")

  const activeTodos = visibleTodos.filter(
    (t) => t.status !== "DONE" && t.status !== "DELETED"
  )
  const doneTodos = visibleTodos.filter((t) => t.status === "DONE")

  return (
    <div>
      {sessionInfo && (
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {isCoach ? `${sessionInfo.startupName} · ` : ""}
            Session #{sessionInfo.sessionNumber}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(sessionInfo.scheduledAt).toLocaleDateString("sv-SE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {visibleTodos.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          Inga todos än — de genereras automatiskt efter mötet.
        </p>
      )}

      {activeTodos.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
            Att göra ({activeTodos.length})
          </h2>
          {activeTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} isCoach={isCoach} onDelete={handleDelete} />
          ))}
        </section>
      )}

      {doneTodos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
            Klara ({doneTodos.length})
          </h2>
          {doneTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} isCoach={isCoach} onDelete={handleDelete} />
          ))}
        </section>
      )}
    </div>
  )
}
