import { requireCoach } from "@/lib/access"
import Link from "next/link"
import SettingsDropdown from "./SettingsDropdown"

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireCoach()

  const isAdmin = ["SYSTEM_ADMIN", "CLIENT_ADMIN"].includes(session.user.role)
  const totpEnabled = session.user.totpEnabled ?? false

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900">OpenX Lab</span>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/screening" className="text-sm text-gray-600 hover:text-gray-900">
            Screening
          </Link>
          <Link href="/coaching" className="text-sm text-gray-600 hover:text-gray-900">
            Coaching
          </Link>
          <Link href="/decisions" className="text-sm text-gray-600 hover:text-gray-900">
            Decisions
          </Link>
          <Link href="/alumni" className="text-sm text-gray-600 hover:text-gray-900">
            Alumni
          </Link>
          <Link href="/knowledge" className="text-sm text-gray-600 hover:text-gray-900">
            Knowledge
          </Link>
          <Link href="/projects" className="text-sm text-gray-600 hover:text-gray-900">
            Projekt
          </Link>

          {isAdmin && (
            <>
              <span className="text-gray-200">|</span>
              <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
                Användare
              </Link>
              <Link href="/admin/programs" className="text-sm text-gray-600 hover:text-gray-900">
                Programs
              </Link>
              <Link href="/admin/agents" className="text-sm text-gray-600 hover:text-gray-900">
                Agenter
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SettingsDropdown email={session.user.email} totpEnabled={totpEnabled} />
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
