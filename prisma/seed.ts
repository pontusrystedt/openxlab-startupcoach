import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const coachPassword = await bcrypt.hash("coach123", 12)
  const entrepreneurPassword = await bcrypt.hash("entrepreneur123", 12)

  const testStartup = await prisma.startup.upsert({
    where: { id: "seed-startup-1" },
    create: {
      id: "seed-startup-1",
      name: "TestStartup AB",
      sector: "MedTech",
    },
    update: {},
  })

  await prisma.user.upsert({
    where: { email: "coach@openxlab.se" },
    create: {
      email: "coach@openxlab.se",
      passwordHash: coachPassword,
      role: "COACH",
    },
    update: { passwordHash: coachPassword },
  })

  await prisma.user.upsert({
    where: { email: "founder@teststartup.se" },
    create: {
      email: "founder@teststartup.se",
      passwordHash: entrepreneurPassword,
      role: "ENTREPRENEUR",
      startupId: testStartup.id,
    },
    update: { passwordHash: entrepreneurPassword, startupId: testStartup.id },
  })

  console.log("Seed klar!")
  console.log("  Coach:        coach@openxlab.se / coach123")
  console.log("  Entrepreneur: founder@teststartup.se / entrepreneur123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
