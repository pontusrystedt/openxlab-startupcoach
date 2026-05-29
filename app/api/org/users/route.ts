import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { generateToken } from "@/lib/tokens"
import { sendWelcomeEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

const ALLOWED_ROLES = ["COACH", "CLIENT_ADMIN", "ENTREPRENEUR"] as const
type AllowedRole = typeof ALLOWED_ROLES[number]

export async function GET() {
  const session = await requireClientAdmin()

  const users = await prisma.user.findMany({
    where: {
      orgId: session.user.orgId!,
      role: { in: ["COACH", "CLIENT_ADMIN", "ENTREPRENEUR"] },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      emailVerified: true,
      startupId: true,
      startup: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await requireClientAdmin()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const { name, email, role, startupId } = await req.json()

  if (!name || !email || !ALLOWED_ROLES.includes(role as AllowedRole)) {
    return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 })
  }

  // Entreprenör måste kopplas till ett bolag
  if (role === "ENTREPRENEUR") {
    if (!startupId) {
      return NextResponse.json({ error: "Välj vilket bolag entreprenören tillhör" }, { status: 400 })
    }
    // Verifiera att bolaget tillhör samma org
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, orgId: session.user.orgId! },
    })
    if (!startup) {
      return NextResponse.json({ error: "Bolaget hittades inte" }, { status: 404 })
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-postadressen används redan" }, { status: 409 })
  }

  // Generera tillfälligt lösenord: 2 ord + 4 siffror
  const words = ["Kaktus","Fjord","Lemon","Cobra","Maple","Storm","Pixel","Solar",
                 "Terra","Orion","Flame","Coast","Prism","Drift","Forge","Atlas"]
  const pick = () => words[Math.floor(Math.random() * words.length)]
  const digits = Math.floor(1000 + Math.random() * 9000).toString()
  const tempPassword = `${pick()}-${pick()}-${digits}`

  const passwordHash = await bcrypt.hash(tempPassword, 12)
  const verifyToken = generateToken()

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      orgId: session.user.orgId!,
      startupId: role === "ENTREPRENEUR" ? startupId : null,
      isActive: true,
      emailVerified: false,
      emailVerifyToken: verifyToken,
      forcePasswordChange: true,
      totpEnabled: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      emailVerified: true,
      startupId: true,
      startup: { select: { name: true } },
      createdAt: true,
    },
  })

  // Lägg automatiskt till Grundare som teammedlem på startupen
  if (role === "ENTREPRENEUR" && startupId) {
    const nameParts = (name as string).trim().split(/\s+/)
    const firstName = nameParts[0] ?? name
    const lastName = nameParts.slice(1).join(" ") || "-"
    await prisma.teamMember.create({
      data: {
        startupId,
        firstName,
        lastName,
        email,
        hasSystemAccess: true,
      },
    })
  }

  try {
    await sendWelcomeEmail({
      to: email,
      name,
      tempPassword,
      verifyToken,
      role: role as AllowedRole,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Välkomstmail misslyckades:", msg)
    return NextResponse.json({
      ...user,
      emailSent: false,
      emailError: msg,
    })
  }

  return NextResponse.json({ ...user, emailSent: true })
}
