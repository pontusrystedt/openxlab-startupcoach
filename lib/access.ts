import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireCoach() {
  const session = await auth()
  if (!session || session.user.role !== "COACH") redirect("/login")
  return session
}

export async function requireEntrepreneur(startupId: string) {
  const session = await auth()
  if (!session) redirect("/login")
  if (
    session.user.role === "ENTREPRENEUR" &&
    session.user.startupId !== startupId
  ) {
    redirect("/unauthorized")
  }
  return session
}

export async function requireAuth() {
  const session = await auth()
  if (!session) redirect("/login")
  return session
}
