import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TodoList } from "@/app/components/todos/TodoList"

export default async function EntrepreneurTodosPage() {
  const session = await auth()
  if (!session || session.user.role !== "ENTREPRENEUR") redirect("/login")
  if (!session.user.startupId) redirect("/unauthorized")

  const latestSession = await prisma.session.findFirst({
    where: {
      startupId: session.user.startupId,
      todos: { some: {} },
    },
    orderBy: { scheduledAt: "desc" },
    include: {
      startup: true,
      todos: {
        where: { status: { not: "DELETED" } },
        orderBy: { priority: "asc" },
      },
    },
  })

  if (!latestSession) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500">
          Inga todos ännu — de dyker upp här efter ert första möte.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <TodoList
        todos={latestSession.todos.map((t) => ({
          ...t,
          dueDate: t.dueDate?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }))}
        isCoach={false}
        sessionInfo={{
          sessionNumber: latestSession.sessionNumber,
          scheduledAt: latestSession.scheduledAt.toISOString(),
          startupName: latestSession.startup.name,
        }}
      />
    </div>
  )
}
