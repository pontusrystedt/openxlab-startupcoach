import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/access"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TodoList from "./TodoList"

export default async function TodosPage() {
  await requireAuth()
  const session = await auth()
  if (!session?.user.startupId) redirect("/login")

  const todos = await prisma.todo.findMany({
    where: {
      session: { startupId: session.user.startupId },
    },
    orderBy: [{ completedAt: "asc" }, { priority: "asc" }],
    include: {
      feedback: true,
      session: { select: { sessionNumber: true } },
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Todos</h1>
      <TodoList initialTodos={todos} />
    </div>
  )
}
