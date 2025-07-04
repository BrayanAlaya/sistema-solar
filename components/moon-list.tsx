"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Moon } from "@/lib/planet-data"

interface MoonListProps {
  planetName: string
  moons: Moon[]
}

export function MoonList({ planetName, moons }: MoonListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lunas de {planetName}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moons.map((moon) => (
          <Card key={moon.name} className="bg-black/50 border-gray-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{moon.name}</CardTitle>
              <CardDescription>{moon.description || "Sin descripción disponible"}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-1">
                <div className="font-semibold">Diámetro:</div>
                <div>{moon.diameter || "Desconocido"}</div>

                <div className="font-semibold">Distancia:</div>
                <div>{moon.orbitDistance || "Desconocido"}</div>

                <div className="font-semibold">Período orbital:</div>
                <div>{moon.orbitalPeriod || "Desconocido"}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
