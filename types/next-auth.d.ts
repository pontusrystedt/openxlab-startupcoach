import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      startupId: string | null
      orgId: string | null
      totpEnabled: boolean
      totpVerified: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    startupId?: string | null
    orgId?: string | null
    totpEnabled?: boolean
    totpVerified?: boolean
  }
}
