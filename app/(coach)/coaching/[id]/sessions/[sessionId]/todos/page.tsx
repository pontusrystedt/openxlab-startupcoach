import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TodoList } from "@/app/components/todos/TodoList"

export default async function CoachTodosPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "COACH") redirect("/login")

  const { id: startupId, sessionId } = await params

  const coachSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      startup: true,
      todos: { orderBy: { priority: "asc" } },
    },
  })

  if (!coachSession || coachSession.startupId !== startupId) redirect("/dashboard")

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <TodoList
        todos={coachSession.todos.map((t) => ({
          ...t,
          dueDate: t.dueDate?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }))}
        isCoach={true}
        sessionInfo={{
          sessionNumber: coachSession.sessionNumber,
          scheduledAt: coachSession.scheduledAt.toISOString(),
          startupName: coachSession.startup.name,
        }}
      />
    </div>
  )
}
