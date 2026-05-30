"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface IrlProfile {
  createdAt: string
  crl: number
  trl: number
  brl: number
  iprl: number
  frl: number
  orl: number
}

interface Props {
  profiles: IrlProfile[]
}

const DIMENSIONS = [
  { key: "crl", label: "Kund", color: "#1D9E75" },
  { key: "trl", label: "Teknik", color: "#378ADD" },
  { key: "brl", label: "Affär", color: "#D85A30" },
  { key: "iprl", label: "IP", color: "#7F77DD" },
  { key: "frl", label: "Funding", color: "#BA7517" },
  { key: "orl", label: "Org", color: "#4DA89F" },
]

export function IrlTrendChart({ profiles }: Props) {
  if (profiles.length < 2) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Minst två mätningar krävs för att visa trend.
      </p>
    )
  }

  // Kronologisk ordning (äldst först)
  const sorted = [...profiles].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const data = sorted.map((p) => ({
    datum: new Date(p.createdAt).toLocaleDateString("sv-SE", {
      month: "short",
      day: "numeric",
    }),
    crl: p.crl,
    trl: p.trl,
    brl: p.brl,
    iprl: p.iprl,
    frl: p.frl,
    orl: p.orl,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="datum" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 9]}
          ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value, name) => [
            `${value}/9`,
            DIMENSIONS.find((d) => d.key === String(name))?.label ?? String(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) =>
            DIMENSIONS.find((d) => d.key === value)?.label ?? value
          }
        />
        {DIMENSIONS.map((d) => (
          <Line
            key={d.key}
            type="monotone"
            dataKey={d.key}
            stroke={d.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
