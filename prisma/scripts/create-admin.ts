/**
 * Creates a ClientAdmin account for Pontus at OpenX Lab.
 * Run with:  npx tsx prisma/scripts/create-admin.ts
 */
import { PrismaClient } from "../../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { config } from "dotenv"
import { resolve } from "path"

// Load local env
config({ path: resolve(process.cwd(), ".env.local") })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Ensure org exists
  let org = await prisma.organization.findUnique({ where: { slug: "openxlab" } })
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "OpenX Lab",
        slug: "openxlab",
        plan: "STANDARD",
        isActive: true,
      },
    })
    console.log("✅ Organisation skapad:", org.name)
  } else {
    console.log("ℹ️  Organisation finns:", org.name)
  }

  const email = "pontus@openxlab.se"
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log("⚠️  Användare finns redan:", email)
    console.log("   Uppdaterar roll och org…")
    await prisma.user.update({
      where: { email },
      data: {
        role: "CLIENT_ADMIN",
        orgId: org.id,
        isActive: true,
        emailVerified: true,
        forcePasswordChange: false,
      },
    })
    console.log("✅ Klar")
    return
  }

  // Temporary password – user will change at first login
  const tempPassword = "OpenXLab-Admin-2024"
  const passwordHash = await bcrypt.hash(tempPassword, 12)
  const verifyToken = randomBytes(32).toString("hex")

  const user = await prisma.user.create({
    data: {
      email,
      name: "Pontus Rystedt",
      passwordHash,
      role: "CLIENT_ADMIN",
      orgId: org.id,
      isActive: true,
      emailVerified: true,         // Skip email verification for this seed account
      emailVerifyToken: verifyToken,
      forcePasswordChange: true,   // Force password change on first login
      totpEnabled: false,
    },
  })

  console.log("")
  console.log("✅ Konto skapat!")
  console.log("   E-post:           ", user.email)
  console.log("   Tillfälligt lösen:", tempPassword)
  console.log("   Roll:             ", user.role)
  console.log("   Org:              ", org.name)
  console.log("")
  console.log("   ⚠️  Byt lösenord direkt vid första inloggning.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
