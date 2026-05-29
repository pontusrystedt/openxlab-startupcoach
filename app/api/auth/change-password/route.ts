import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { password } = await req.json()

  if (
    !password ||
    password.length < 12 ||
    !/\d/.test(password) ||
    !/[a-zA-Z]/.test(password)
  ) {
    return NextResponse.json(
      { error: "Lösenordet måste vara minst 12 tecken och innehålla både bokstäver och siffror." },
      { status: 400 }
    )
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: hash,
      forcePasswordChange: false,
    },
  })

  const nextStep = session.user.totpEnabled ? "dashboard" : "totp-setup"

  const res = NextResponse.json({ ok: true, nextStep })

  // Kortlivad cookie som middleware kan läsa direkt — kringgår JWT-race condition
  res.cookies.set("x_pw_changed", session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 120, // 2 minuter räcker för redirecten
    path: "/",
  })

  return res
}
