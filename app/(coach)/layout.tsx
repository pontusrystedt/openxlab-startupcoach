import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { signOut } from "@/auth"

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireCoach()

  const isAdmin = ["SYSTEM_ADMIN", "CLIENT_ADMIN"].includes(session.user.role)

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
          <Link href="/startups" className="text-sm text-gray-600 hover:text-gray-900">
            Coaching
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
            <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
              Användare
            </Link>
          )}
          <Link href="/admin/programs" className="text-sm text-gray-600 hover:text-gray-900">
            Program
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user.email}</span>
          <Link
            href="/settings/security"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Säkerhet
          </Link>
          <Link
            href="/security"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Datasäkerhet
          </Link>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Logga ut
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
