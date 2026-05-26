import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Alltid tillåt: webhook, statiska filer
  const publicPaths = ["/api/webhook", "/_next", "/favicon.ico"]
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  // TOTP-relaterade routes är tillåtna utan full autentisering
  const totpPaths = ["/verify-totp", "/api/auth/totp"]
  if (totpPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Ej inloggad → login (utom login-sidan själv)
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Om TOTP är aktiverat och inte verifierat → verify-totp
  if (session?.user.totpEnabled && !session.user.totpVerified) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/verify-totp", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
