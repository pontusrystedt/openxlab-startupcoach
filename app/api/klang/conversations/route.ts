import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch("https://app.klang.ai/api/v1/conversations", {
    headers: {
      Authorization: `Bearer ${process.env.KLANG_API_KEY}`,
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Klang API-fel" }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
