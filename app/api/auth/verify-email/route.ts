import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
  }

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  })

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  })

  // Redirect till lösenordsbyte (forcePasswordChange = true vid nya konton)
  return NextResponse.redirect(new URL("/change-password?verified=true", req.url))
}
