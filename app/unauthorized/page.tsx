import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Åtkomst nekad</h1>
        <p className="text-gray-500 mb-4">Du har inte behörighet att se denna sida.</p>
        <Link
          href="/login"
          className="text-sm text-[#1D9E75] hover:underline"
        >
          Tillbaka till inloggning
        </Link>
      </div>
    </div>
  )
}
