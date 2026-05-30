/**
 * Global test setup — runs before any test file.
 *
 * Sets required environment variables so that modules that import
 * process.env values at module-load time (crypto.ts, prisma.ts …)
 * see sensible defaults, without touching the real .env.local file.
 */

// 32-byte hex key (256 bits) — test-only value
process.env.ENCRYPTION_KEY =
  "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"

// Use TEST_DATABASE_URL if set, otherwise fall back to DATABASE_URL
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}

// NextAuth secret
process.env.AUTH_SECRET = "test-secret-for-integration-tests-only"
process.env.NEXTAUTH_URL = "http://localhost:3000"

// Klang webhook secret
process.env.KLANG_WEBHOOK_SECRET = "test-webhook-secret-12345"

// Suppress Mistral / Klang network calls unless explicitly overridden
process.env.MISTRAL_API_KEY = "test-mistral-key"
process.env.KLANG_API_KEY = "test-klang-key"
