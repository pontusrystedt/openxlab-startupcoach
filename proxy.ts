import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Alltid tillåt: webhook, statiska filer
  const publicPaths = ["/api/webhook", "/_next", "/favicon.ico"]
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  // E-postverifiering och lösenordsbyte är tillåtna utan autentisering
  const authFlowPaths = [
    "/verify-email",
    "/change-password",
    "/api/auth/verify-email",
    "/api/auth/change-password",
  ]
  if (authFlowPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  // TOTP-relaterade routes
  const totpPaths = ["/verify-totp", "/api/auth/totp"]
  if (totpPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Ej inloggad → login
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session) {
    const userId = session.user.id

    // Tvingat lösenordsbyte — men inte om x_pw_changed-cookie är satt för denna användare
    const pwChanged = req.cookies.get("x_pw_changed")?.value
    if (session.user.forcePasswordChange && pwChanged !== userId) {
      return NextResponse.redirect(new URL("/change-password", req.url))
    }

    // TOTP-verifiering — men inte om x_totp_ok-cookie är satt för denna användare
    const totpOk = req.cookies.get("x_totp_ok")?.value
    if (session.user.totpEnabled && !session.user.totpVerified && totpOk !== userId) {
      if (pathname !== "/login" && !pathname.includes("/meeting-support")) {
        return NextResponse.redirect(new URL("/verify-totp", req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
