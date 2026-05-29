import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  await requireClientAdmin()

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "Mottagaradress saknas" }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "RESEND_API_KEY saknas i miljövariablerna",
    })
  }

  const from = process.env.EMAIL_FROM ?? "startupcoach@openxlab.se"

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from,
      to,
      subject: "E-posttest — OpenX Lab Startupcoach",
      text: "Det här är ett testmail för att bekräfta att Resend-konfigurationen fungerar.",
    })

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message, from })
    }

    return NextResponse.json({ ok: true, id: result.data?.id, from })
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      from,
    })
  }
}
