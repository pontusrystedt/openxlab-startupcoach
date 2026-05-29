import { requireAuth } from "@/lib/access"
import Link from "next/link"
import EntrepreneurSettingsDropdown from "./EntrepreneurSettingsDropdown"

export default async function EntrepreneurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900">OpenX Lab</span>
          <Link href="/my" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/my/todos" className="text-sm text-gray-600 hover:text-gray-900">
            Todos
          </Link>
          <Link href="/my/irl" className="text-sm text-gray-600 hover:text-gray-900">
            IRL-profil
          </Link>
        </div>
        <EntrepreneurSettingsDropdown email={session.user.email} />
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
