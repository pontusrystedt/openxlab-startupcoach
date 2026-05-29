import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://startupcoach.openxlab.se"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid-token`)
  }

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  })

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid-token`)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  })

  return NextResponse.redirect(`${APP_URL}/change-password?verified=true`)
}
