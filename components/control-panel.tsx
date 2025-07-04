"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { planetData } from "@/lib/planet-data"
import {
  Clock,
  Pause,
  Play,
  SpaceIcon as Planet,
  Moon,
  Orbit,
  Route,
  Ruler,
  Volume2,
  VolumeX,
  Info,
  Eye,
  Lightbulb,
} from "lucide-react"

interface ControlPanelProps {
  timeSpeed: number
  setTimeSpeed: (speed: number) => void
  isPaused: boolean
  setIsPaused: (paused: boolean) => void
  showOrbits: boolean
  setShowOrbits: (show: boolean) => void
  showTrajectories: boolean
  setShowTrajectories: (show: boolean) => void
  showRealSizes: boolean
  setShowRealSizes: (show: boolean) => void
  showMoons: boolean
  setShowMoons: (show: boolean) => void
  selectedPlanet: string | null
  setSelectedPlanet: (planet: string | null) => void
  followPlanet: boolean
  setFollowPlanet: (follow: boolean) => void
  showIllumination: boolean
  setShowIllumination: (show: boolean) => void
  audioEnabled: boolean
  setAudioEnabled: (enabled: boolean) => void
  audioVolume: number
  setAudioVolume: (volume: number) => void
}

export function ControlPanel({
  timeSpeed,
  setTimeSpeed,
  isPaused,
  setIsPaused,
  showOrbits,
  setShowOrbits,
  showTrajectories,
  setShowTrajectories,
  showRealSizes,
  setShowRealSizes,
  showMoons,
  setShowMoons,
  selectedPlanet,
  setSelectedPlanet,
  followPlanet,
  setFollowPlanet,
  showIllumination,
  setShowIllumination,
  audioEnabled,
  setAudioEnabled,
  audioVolume,
  setAudioVolume,
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`fixed top-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 transition-all duration-300 z-10 border border-gray-800 ${
        isExpanded ? "w-80" : "w-auto"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          <Planet className="h-5 w-5" />
          {isExpanded ? "Control del Sistema Solar" : ""}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:bg-white/10"
        >
          {isExpanded ? "Minimizar" : "Expandir"}
        </Button>
      </div>

      {isExpanded ? (
        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="time">Tiempo</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="planets">Planetas</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Velocidad de tiempo
                </span>
                <span className="text-white font-mono">{timeSpeed}x</span>
              </div>
              <Slider
                value={[timeSpeed]}
                min={0.1}
                max={10}
                step={0.1}
                onValueChange={(value) => setTimeSpeed(value[0])}
              />
            </div>

            <div className="flex justify-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setTimeSpeed(0.5)}>
                      0.5x
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Velocidad lenta (0.5x)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setTimeSpeed(1)}>
                      1x
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Velocidad normal (1x)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setTimeSpeed(5)}>
                      5x
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Velocidad rápida (5x)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-center">
              <Button
                variant={isPaused ? "default" : "destructive"}
                onClick={() => setIsPaused(!isPaused)}
                className="w-full"
              >
                {isPaused ? (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Reanudar
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pausar
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              <p>Teclas: Espacio (pausar), 1-5 (velocidad)</p>
            </div>
          </TabsContent>

          <TabsContent value="visual" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Orbit className="h-4 w-4" />
                Mostrar órbitas
              </span>
              <Switch checked={showOrbits} onCheckedChange={setShowOrbits} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Route className="h-4 w-4" />
                Mostrar trayectorias
              </span>
              <Switch checked={showTrajectories} onCheckedChange={setShowTrajectories} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Tamaños reales
              </span>
              <Switch checked={showRealSizes} onCheckedChange={setShowRealSizes} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Mostrar lunas
              </span>
              <Switch checked={showMoons} onCheckedChange={setShowMoons} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Iluminación realista
              </span>
              <Switch checked={showIllumination} onCheckedChange={setShowIllumination} />
            </div>

            <div className="text-xs text-gray-400 mt-2">
              <p>Teclas: O (órbitas), I (iluminación), T (trayectorias)</p>
            </div>
          </TabsContent>

          <TabsContent value="planets" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(planetData).map(([name, data]) => (
                <Button
                  key={name}
                  variant={selectedPlanet === name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlanet(name)}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <div className="w-6 h-6 rounded-full mb-1" style={{ backgroundColor: data.color || "#ffffff" }} />
                  <span className="text-xs">{name}</span>
                </Button>
              ))}
            </div>

            {selectedPlanet && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-white flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Seguir planeta
                </span>
                <Switch checked={followPlanet} onCheckedChange={setFollowPlanet} />
              </div>
            )}

            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlanet(null)
                  setFollowPlanet(false)
                }}
                className="w-full"
              >
                Deseleccionar
              </Button>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              <p>Haz clic en un planeta para seleccionarlo</p>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Audio ambiental
              </span>
              <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            </div>

            {audioEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white">Volumen</span>
                  <span className="text-white font-mono">{Math.round(audioVolume * 100)}%</span>
                </div>
                <Slider
                  value={[audioVolume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setAudioVolume(value[0])}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col gap-2">
          <Button variant={isPaused ? "default" : "destructive"} size="sm" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowOrbits(!showOrbits)}>
                  <Orbit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mostrar/ocultar órbitas (O)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showTrajectories ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowTrajectories(!showTrajectories)}
                >
                  <Route className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mostrar/ocultar trayectorias (T)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setAudioEnabled(!audioEnabled)}>
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Activar/desactivar audio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedPlanet("Tierra")}>
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Información de planetas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}
