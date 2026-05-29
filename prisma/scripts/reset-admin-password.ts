import { PrismaClient } from "../../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = "pontus@openxlab.se"
  const tempPassword = "OpenXLab-2024!"

  const hash = await bcrypt.hash(tempPassword, 12)

  await prisma.user.update({
    where: { email },
    data: {
      passwordHash: hash,
      forcePasswordChange: true,
    },
  })

  console.log("✅ Lösenord återställt")
  console.log("   E-post:   ", email)
  console.log("   Lösenord:", tempPassword)
  console.log("")
  console.log("   Du tvingas byta lösenord vid nästa inloggning.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
