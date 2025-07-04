"use client"

import { useEffect, useState } from "react"
import { ControlPanel } from "@/components/control-panel"
import { PlanetInfo } from "@/components/planet-info"
import { EnhancedAudioPlayer } from "@/components/enhanced-audio-player"
import { WebGLSolarSystem } from "@/components/webgl-solar-system"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [timeSpeed, setTimeSpeed] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showTrajectories, setShowTrajectories] = useState(false)
  const [showRealSizes, setShowRealSizes] = useState(false)
  const [showMoons, setShowMoons] = useState(true)
  const [followPlanet, setFollowPlanet] = useState(false)
  const [showIllumination, setShowIllumination] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.5)
  const { toast } = useToast()

  // Listen for planet selection events
  useEffect(() => {
    const handlePlanetSelected = (e: CustomEvent<{ planetName: string }>) => {
      setSelectedPlanet(e.detail.planetName)
      toast({
        title: `${e.detail.planetName} seleccionado`,
        description: "Información del planeta disponible",
        duration: 2000,
      })
    }

    window.addEventListener("planetSelected" as any, handlePlanetSelected as any)

    return () => {
      window.removeEventListener("planetSelected" as any, handlePlanetSelected as any)
    }
  }, [toast])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault()
          setIsPaused((prev) => !prev)
          toast({
            title: isPaused ? "Simulación reanudada" : "Simulación pausada",
            duration: 1500,
          })
          break
        case "o":
        case "O":
          setShowOrbits((prev) => !prev)
          toast({
            title: showOrbits ? "Órbitas ocultas" : "Órbitas visibles",
            duration: 1500,
          })
          break
        case "i":
        case "I":
          setShowIllumination((prev) => !prev)
          toast({
            title: showIllumination ? "Iluminación uniforme" : "Iluminación realista",
            duration: 1500,
          })
          break
        case "t":
        case "T":
          setShowTrajectories((prev) => {
            const newValue = !prev
            toast({
              title: newValue ? "Trayectorias visibles" : "Trayectorias ocultas",
              duration: 1500,
            })
            return newValue
          })
          break
        case "1":
          setTimeSpeed(0.5)
          toast({ title: "Velocidad: 0.5x", duration: 1500 })
          break
        case "2":
          setTimeSpeed(1)
          toast({ title: "Velocidad: 1x", duration: 1500 })
          break
        case "3":
          setTimeSpeed(2)
          toast({ title: "Velocidad: 2x", duration: 1500 })
          break
        case "4":
          setTimeSpeed(5)
          toast({ title: "Velocidad: 5x", duration: 1500 })
          break
        case "5":
          setTimeSpeed(10)
          toast({ title: "Velocidad: 10x", duration: 1500 })
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPaused, showOrbits, showIllumination, showTrajectories, toast])

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <WebGLSolarSystem
        timeSpeed={timeSpeed}
        isPaused={isPaused}
        showOrbits={showOrbits}
        showTrajectories={showTrajectories}
        showRealSizes={showRealSizes}
        showMoons={showMoons}
        selectedPlanet={selectedPlanet}
        followPlanet={followPlanet}
        showIllumination={showIllumination}
      />

      <ControlPanel
        timeSpeed={timeSpeed}
        setTimeSpeed={setTimeSpeed}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showTrajectories={showTrajectories}
        setShowTrajectories={setShowTrajectories}
        showRealSizes={showRealSizes}
        setShowRealSizes={setShowRealSizes}
        showMoons={showMoons}
        setShowMoons={setShowMoons}
        selectedPlanet={selectedPlanet}
        setSelectedPlanet={setSelectedPlanet}
        followPlanet={followPlanet}
        setFollowPlanet={setFollowPlanet}
        showIllumination={showIllumination}
        setShowIllumination={setShowIllumination}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        audioVolume={audioVolume}
        setAudioVolume={setAudioVolume}
      />

      {selectedPlanet && <PlanetInfo planetName={selectedPlanet} onClose={() => setSelectedPlanet(null)} />}

      <EnhancedAudioPlayer enabled={audioEnabled} volume={audioVolume} />

      {/* Help text */}
      <div className="fixed bottom-4 left-4 text-white/60 text-sm z-20">
        <p>Controles 3D: Click y arrastra para rotar, rueda del ratón para zoom</p>
        <p>Teclas: Espacio (pausar), O (órbitas), I (iluminación), T (trayectorias), 1-5 (velocidad)</p>
      </div>
    </main>
  )
}
