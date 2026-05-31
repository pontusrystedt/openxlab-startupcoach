import { requireClientAdmin } from "@/lib/access"
import { auth } from "@/auth"
import AdminAgentsPage from "./AgentsClient"

export default async function Page() {
  await requireClientAdmin()
  const session = await auth()
  const isSystemAdmin = session?.user.role === "SYSTEM_ADMIN"

  return <AdminAgentsPage isSystemAdmin={isSystemAdmin} />
}
