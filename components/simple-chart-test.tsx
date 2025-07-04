"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

export function SimpleChartTest() {
  const testData = [
    { name: "A", value: 100 },
    { name: "B", value: 200 },
    { name: "C", value: 150 },
    { name: "D", value: 300 },
  ]

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-center text-white">Test Chart</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={testData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: "#ffffff" }} />
            <YAxis tick={{ fill: "#ffffff" }} />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
