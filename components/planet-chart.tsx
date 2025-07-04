"use client"

import { planetData } from "@/lib/planet-data"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface PlanetChartProps {
  planetName: string
}

export function PlanetChart({ planetName }: PlanetChartProps) {
  // Helper function to safely parse diameter
  const parseDiameter = (diameterStr: string | undefined): number => {
    if (!diameterStr) return 0
    try {
      // Remove commas and extract the first number
      const cleanStr = diameterStr.replace(/,/g, "").replace(/\./g, "")
      const match = cleanStr.match(/(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    } catch {
      return 0
    }
  }

  // Helper function to safely parse distance
  const parseDistance = (distanceStr: string | undefined): number => {
    if (!distanceStr) return 0
    try {
      // Remove commas and extract the first number
      const cleanStr = distanceStr.replace(/,/g, "").replace(/\./g, "")
      const match = cleanStr.match(/(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    } catch {
      return 0
    }
  }

  // Helper function to safely parse year
  const parseYear = (yearStr: string | undefined): number => {
    if (!yearStr) return 0
    try {
      if (yearStr.includes("días")) {
        const match = yearStr.match(/(\d+(?:\.\d+)?)/)
        return match ? Number.parseFloat(match[1]) / 365.25 : 0
      } else if (yearStr.includes("años")) {
        const match = yearStr.match(/(\d+(?:\.\d+)?)/)
        return match ? Number.parseFloat(match[1]) : 0
      }
      return 0
    } catch {
      return 0
    }
  }

  // Prepare data for comparison charts
  const sizeData = Object.entries(planetData)
    .filter(([name, data]) => name !== "Sol" && data?.details?.diameter)
    .map(([name, data]) => ({
      name,
      size: parseDiameter(data.details.diameter),
      fill: data.color || "#ffffff",
    }))
    .filter((item) => item.size > 0)
    .sort((a, b) => b.size - a.size)

  const distanceData = Object.entries(planetData)
    .filter(([name, data]) => name !== "Sol" && data?.details?.distance)
    .map(([name, data]) => ({
      name,
      distance: parseDistance(data.details.distance),
      fill: data.color || "#ffffff",
    }))
    .filter((item) => item.distance > 0)
    .sort((a, b) => a.distance - b.distance)

  const yearData = Object.entries(planetData)
    .filter(([name, data]) => name !== "Sol" && data?.details?.year)
    .map(([name, data]) => ({
      name,
      year: parseYear(data.details.year),
      fill: data.color || "#ffffff",
    }))
    .filter((item) => item.year > 0)
    .sort((a, b) => a.year - b.year)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-gray-600 rounded p-2 text-white">
          <p className="font-semibold">{label}</p>
          <p>
            {payload[0].name}: {payload[0].value?.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  // If no data is available, show a message
  if (sizeData.length === 0 && distanceData.length === 0 && yearData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No hay datos disponibles para mostrar gráficos comparativos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-white">
      {sizeData.length > 0 && (
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Comparación de Tamaños (Diámetro en km)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                  axisLine={{ stroke: "#ffffff" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                  axisLine={{ stroke: "#ffffff" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="size" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {distanceData.length > 0 && (
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Distancia del Sol (millones de km)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                  axisLine={{ stroke: "#ffffff" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: "#ffffff", fontSize: 12 }} axisLine={{ stroke: "#ffffff" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="distance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {yearData.length > 0 && (
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Duración del Año (años terrestres)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                  axisLine={{ stroke: "#ffffff" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: "#ffffff", fontSize: 12 }} axisLine={{ stroke: "#ffffff" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="year" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
