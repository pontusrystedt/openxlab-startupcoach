import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
      startupId: string | null
      orgId: string | null
      totpEnabled: boolean
      totpVerified: boolean
      forcePasswordChange: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    name?: string | null
    startupId?: string | null
    orgId?: string | null
    totpEnabled?: boolean
    totpVerified?: boolean
    forcePasswordChange?: boolean
  }
}
