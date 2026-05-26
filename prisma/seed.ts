import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Organization
  const org = await prisma.organization.upsert({
    where: { slug: "ideon" },
    create: {
      name: "Ideon Science Park",
      slug: "ideon",
    },
    update: {},
  })
  console.log(`  Org: ${org.name} (${org.id})`)

  // Program
  const program = await prisma.program.upsert({
    where: { id: "prog-ideon-standard" },
    create: {
      id: "prog-ideon-standard",
      orgId: org.id,
      name: "Ideon ordinarie",
      description: "Ordinarie coachingprogram",
    },
    update: {},
  })
  console.log(`  Program: ${program.name}`)

  const coachPassword = await bcrypt.hash("coach123", 12)
  const entrepreneurPassword = await bcrypt.hash("entrepreneur123", 12)

  const testStartup = await prisma.startup.upsert({
    where: { id: "seed-startup-1" },
    create: {
      id: "seed-startup-1",
      name: "TestStartup AB",
      sector: "MedTech",
      orgId: org.id,
      programId: program.id,
    },
    update: { orgId: org.id, programId: program.id },
  })

  await prisma.user.upsert({
    where: { email: "coach@openxlab.se" },
    create: {
      email: "coach@openxlab.se",
      passwordHash: coachPassword,
      role: "COACH",
      orgId: org.id,
    },
    update: { passwordHash: coachPassword, orgId: org.id },
  })

  await prisma.user.upsert({
    where: { email: "founder@teststartup.se" },
    create: {
      email: "founder@teststartup.se",
      passwordHash: entrepreneurPassword,
      role: "ENTREPRENEUR",
      startupId: testStartup.id,
      orgId: org.id,
    },
    update: {
      passwordHash: entrepreneurPassword,
      startupId: testStartup.id,
      orgId: org.id,
    },
  })

  // Koppla befintliga poster till org
  await prisma.startup.updateMany({
    where: { orgId: null },
    data: { orgId: org.id, programId: program.id },
  })
  await prisma.user.updateMany({
    where: { orgId: null },
    data: { orgId: org.id },
  })

  console.log("Seed klar!")
  console.log("  Coach:        coach@openxlab.se / coach123")
  console.log("  Entrepreneur: founder@teststartup.se / entrepreneur123")
  console.log(`  Org-ID: ${org.id}  (använd detta i SQL-migrationen)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
