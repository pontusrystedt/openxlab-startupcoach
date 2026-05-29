import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  await requireClientAdmin()

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "Mottagaradress saknas" }, { status: 400 })

  const host = process.env.SMTP_HOST ?? "smtp.office365.com"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    return NextResponse.json({
      ok: false,
      error: "SMTP_USER eller SMTP_PASS saknas i miljövariablerna",
    })
  }

  const transport = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { ciphers: "SSLv3" },
  })

  // Verifiera anslutningen
  try {
    await transport.verify()
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      stage: "verify",
      error: err instanceof Error ? err.message : String(err),
      config: { host, user, port: 587 },
    })
  }

  // Skicka testmail
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? user,
      to,
      subject: "SMTP-test — OpenX Lab Startupcoach",
      text: "Det här är ett testmail för att bekräfta att SMTP-konfigurationen fungerar.",
    })
    return NextResponse.json({ ok: true, config: { host, user, port: 587 } })
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      stage: "send",
      error: err instanceof Error ? err.message : String(err),
      config: { host, user, port: 587 },
    })
  }
}
