"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { planetData } from "@/lib/planet-data"
import { MoonList } from "@/components/moon-list"
import { PlanetChart } from "@/components/planet-chart"

interface PlanetInfoProps {
  planetName: string
  onClose: () => void
}

export function PlanetInfo({ planetName, onClose }: PlanetInfoProps) {
  const [isOpen, setIsOpen] = useState(true)
  const planet = planetData[planetName]

  if (!planet) {
    return null
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const hasMoons = planet.moons && planet.moons.length > 0

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-lg border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: planet.color || "#ffffff" }} />
            {planetName}
          </DialogTitle>
          <DialogDescription className="text-gray-300">{planet.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className={`grid ${hasMoons ? "grid-cols-3" : "grid-cols-2"} mb-4 bg-gray-800`}>
            <TabsTrigger value="info" className="text-white data-[state=active]:bg-gray-600">
              Información
            </TabsTrigger>
            {hasMoons && (
              <TabsTrigger value="moons" className="text-white data-[state=active]:bg-gray-600">
                Lunas ({planet.moons.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="charts" className="text-white data-[state=active]:bg-gray-600">
              Gráficos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img
                  src={`/images/${planetName.toLowerCase()}.jpg`}
                  alt={planetName}
                  className={`w-full h-auto rounded-lg ${planetName === "Tierra" ? "rotate-180" : ""}`}
                  onError={(e) => {
                    e.currentTarget.src = `/textures/${planet.texture}`
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold text-gray-300">Diámetro:</div>
                  <div>{planet.details.diameter}</div>

                  <div className="font-semibold text-gray-300">Masa:</div>
                  <div>{planet.details.mass}</div>

                  <div className="font-semibold text-gray-300">Temperatura:</div>
                  <div>{planet.details.temperature}</div>

                  <div className="font-semibold text-gray-300">Distancia del Sol:</div>
                  <div>{planet.details.distance}</div>

                  <div className="font-semibold text-gray-300">Período orbital:</div>
                  <div>{planet.details.year}</div>

                  <div className="font-semibold text-gray-300">Período de rotación:</div>
                  <div>{planet.details.day || "Desconocido"}</div>

                  <div className="font-semibold text-gray-300">Composición:</div>
                  <div>{planet.details.composition || "Desconocido"}</div>

                  <div className="font-semibold text-gray-300">Atmósfera:</div>
                  <div>{planet.details.atmosphere || "Desconocido"}</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Datos interesantes</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {planet.facts?.map((fact, index) => <li key={index}>{fact}</li>) || <li>No hay datos disponibles</li>}
              </ul>
            </div>
          </TabsContent>

          {hasMoons && (
            <TabsContent value="moons" className="space-y-4 mt-4">
              <MoonList planetName={planetName} moons={planet.moons} />
            </TabsContent>
          )}
          <TabsContent value="charts" className="space-y-4 mt-4">
            <PlanetChart planetName={planetName} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
