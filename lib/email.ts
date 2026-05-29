import { Resend } from "resend"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY saknas")
  return new Resend(key)
}

const FROM = process.env.EMAIL_FROM ?? "startupcoach@openxlab.se"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://startupcoach.openxlab.se"

export async function sendWelcomeEmail({
  to,
  name,
  tempPassword,
  verifyToken,
  role,
}: {
  to: string
  name: string
  tempPassword: string
  verifyToken: string
  role: "COACH" | "CLIENT_ADMIN" | "ENTREPRENEUR"
}) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${verifyToken}`
  const roleLabel = role === "COACH" ? "Coach" : role === "CLIENT_ADMIN" ? "Administratör" : "Grundare"

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Välkommen till OpenX Lab Startupcoach",
    html: `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <div style="background:#1A1A2E;padding:24px;border-radius:8px;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:20px">OpenX Lab Startupcoach</h1>
    <p style="color:#AAAACC;margin:8px 0 0;font-size:14px">Ditt konto är klart</p>
  </div>
  <p>Hej ${name},</p>
  <p>Du har fått ett konto som <strong>${roleLabel}</strong> i OpenX Lab Startupcoach.</p>
  <div style="background:#F5F5F5;border-radius:8px;padding:16px;margin:20px 0">
    <p style="margin:0 0 8px;font-weight:bold">Dina inloggningsuppgifter:</p>
    <p style="margin:4px 0">E-post: <strong>${to}</strong></p>
    <p style="margin:4px 0">Tillfälligt lösenord: <strong style="font-family:monospace;font-size:16px">${tempPassword}</strong></p>
  </div>
  <p><strong>Tre steg för att komma igång:</strong></p>
  <div style="border-left:3px solid #1D9E75;padding-left:16px;margin:16px 0">
    <p style="margin:0 0 4px"><strong>Steg 1 — Verifiera din e-postadress</strong></p>
    <p style="margin:0;color:#666;font-size:14px">Klicka på länken nedan. Giltig i 24 timmar.</p>
  </div>
  <a href="${verifyUrl}" style="display:inline-block;background:#1D9E75;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:8px 0 20px">
    Verifiera e-postadress →
  </a>
  <div style="border-left:3px solid #1D9E75;padding-left:16px;margin:16px 0">
    <p style="margin:0 0 4px"><strong>Steg 2 — Byt lösenord</strong></p>
    <p style="margin:0;color:#666;font-size:14px">Du ombeds byta det tillfälliga lösenordet direkt vid inloggning.</p>
  </div>
  <div style="border-left:3px solid #1D9E75;padding-left:16px;margin:16px 0">
    <p style="margin:0 0 4px"><strong>Steg 3 — Sätt upp tvåfaktorsautentisering (TOTP)</strong></p>
    <p style="margin:0;color:#666;font-size:14px">Ladda ner Google Authenticator eller Authy och skanna QR-koden.</p>
  </div>
  <div style="background:#EAF3DE;border-radius:8px;padding:16px;margin:24px 0">
    <p style="margin:0;font-size:13px;color:#1D3A28"><strong>Säkerhetsinformation:</strong> Dela aldrig det tillfälliga lösenordet. OpenX Lab kommer aldrig att fråga om ditt lösenord via e-post eller telefon.</p>
  </div>
  <p style="color:#888;font-size:13px;margin-top:32px;border-top:1px solid #EEE;padding-top:16px">
    OpenX Lab AB · Ideon Science Park · Lund
  </p>
</body>
</html>`,
  })
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: {
  to: string
  name: string
  resetToken: string
}) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Återställ ditt lösenord — OpenX Lab Startupcoach",
    html: `<!DOCTYPE html>
<html lang="sv">
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <div style="background:#1A1A2E;padding:24px;border-radius:8px;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:20px">OpenX Lab Startupcoach</h1>
  </div>
  <p>Hej ${name},</p>
  <p>En begäran om lösenordsåterställning har gjorts för ditt konto.</p>
  <p>Länken nedan är giltig i <strong>1 timme</strong>.</p>
  <a href="${resetUrl}" style="display:inline-block;background:#1D9E75;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
    Återställ lösenord →
  </a>
  <p style="color:#888;font-size:13px">Om du inte begärt detta kan du ignorera mailet.</p>
</body>
</html>`,
  })
}
