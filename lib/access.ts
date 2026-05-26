import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireCoach() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["SYSTEM_ADMIN", "CLIENT_ADMIN", "COACH"].includes(session.user.role)) {
    redirect("/login")
  }
  if (session.user.totpEnabled && !session.user.totpVerified) {
    redirect("/verify-totp")
  }
  // Returnera session med orgId typat som string (alla coaches ska ha orgId)
  return session as typeof session & { user: typeof session.user & { orgId: string } }
}

export async function requireClientAdmin() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["SYSTEM_ADMIN", "CLIENT_ADMIN"].includes(session.user.role)) {
    redirect("/unauthorized")
  }
  return session
}

export async function requireOrgAccess(orgId: string) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role === "SYSTEM_ADMIN") return session
  if (session.user.orgId !== orgId) redirect("/unauthorized")
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

export async function requireEntrepreneurStartupAccess(startupId: string) {
  return requireEntrepreneur(startupId)
}

export async function requireAuth() {
  const session = await auth()
  if (!session) redirect("/login")
  return session
}
