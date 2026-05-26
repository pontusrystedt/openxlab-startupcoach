import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await requireClientAdmin()

  const users = await prisma.user.findMany({
    where: {
      orgId: session.user.orgId!,
      role: { in: ["COACH", "CLIENT_ADMIN"] },
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
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

  const { email, password, role = "COACH" } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "E-post och lösenord krävs" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-postadressen används redan" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      orgId: session.user.orgId!,
      isActive: true,
    },
    select: { id: true, email: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json(user)
}
