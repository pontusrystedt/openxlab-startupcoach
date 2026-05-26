import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { startup: true },
        })

        if (!user) return null

        // Blockera inaktiva konton
        if (!user.isActive) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          startupId: user.startupId,
          orgId: user.orgId,
          totpEnabled: user.totpEnabled,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role: string }).role
        token.startupId = (user as { startupId: string | null }).startupId
        token.orgId = (user as { orgId: string | null }).orgId
        token.totpEnabled = (user as { totpEnabled: boolean }).totpEnabled
        token.totpVerified = false // Resettas vid ny session
      }
      // Uppdatera totpVerified via useSession().update()
      if (trigger === "update" && (session as { totpVerified?: boolean })?.totpVerified === true) {
        token.totpVerified = true
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as string
      session.user.startupId = token.startupId as string | null
      session.user.orgId = token.orgId as string | null
      session.user.totpEnabled = token.totpEnabled as boolean
      session.user.totpVerified = token.totpVerified as boolean
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
