"use client"

import { useEffect, useRef } from "react"
import { planetData } from "@/lib/planet-data"

interface SolarSystemCanvasProps {
  timeSpeed: number
  isPaused: boolean
  showOrbits: boolean
  showTrajectories: boolean
  showRealSizes: boolean
  showMoons: boolean
  selectedPlanet: string | null
  followPlanet: boolean
  showIllumination: boolean
}

export function SolarSystemCanvas({
  timeSpeed,
  isPaused,
  showOrbits,
  showTrajectories,
  showRealSizes,
  showMoons,
  selectedPlanet,
  followPlanet,
  showIllumination,
}: SolarSystemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef<number>(0)
  const trajectoryPointsRef = useRef<Record<string, { x: number; y: number }[]>>({})

  // Camera controls
  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
    targetX: 0,
    targetY: 0,
    targetZoom: 1,
  })

  // Mouse controls
  const mouseRef = useRef({
    isDown: false,
    lastX: 0,
    lastY: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true
      mouseRef.current.lastX = e.clientX
      mouseRef.current.lastY = e.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return

      const deltaX = e.clientX - mouseRef.current.lastX
      const deltaY = e.clientY - mouseRef.current.lastY

      cameraRef.current.targetX += deltaX / cameraRef.current.zoom
      cameraRef.current.targetY += deltaY / cameraRef.current.zoom

      mouseRef.current.lastX = e.clientX
      mouseRef.current.lastY = e.clientY
    }

    const handleMouseUp = () => {
      mouseRef.current.isDown = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      cameraRef.current.targetZoom = Math.max(0.1, Math.min(5, cameraRef.current.targetZoom * zoomFactor))
    }

    const handleClick = (e: MouseEvent) => {
      if (mouseRef.current.isDown) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Convert screen coordinates to world coordinates
      const worldX = (x - canvas.width / 2) / cameraRef.current.zoom - cameraRef.current.x
      const worldY = (y - canvas.height / 2) / cameraRef.current.zoom - cameraRef.current.y

      // Check if click is on a planet
      Object.entries(planetData).forEach(([name, data]) => {
        if (name === "Sol") {
          // Check sun
          const distance = Math.sqrt(worldX * worldX + worldY * worldY)
          if (distance < data.size * 10) {
            const event = new CustomEvent("planetSelected", { detail: { planetName: name } })
            window.dispatchEvent(event)
          }
        } else {
          // Check planets
          const angle = timeRef.current * data.speed
          const planetX = Math.cos(angle) * data.distance * 10
          const planetY = Math.sin(angle) * data.distance * 10

          const distance = Math.sqrt((worldX - planetX) ** 2 + (worldY - planetY) ** 2)
          const planetSize = showRealSizes ? data.realScale * 5 : data.size * 10

          if (distance < planetSize) {
            const event = new CustomEvent("planetSelected", { detail: { planetName: name } })
            window.dispatchEvent(event)
          }
        }
      })
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel)
    canvas.addEventListener("click", handleClick)

    // Function to draw Saturn's rings
    const drawSaturnRings = (ctx: CanvasRenderingContext2D, x: number, y: number, planetSize: number) => {
      const ringInnerRadius = planetSize * 1.2
      const ringOuterRadius = planetSize * 2.0
      const ringMiddleRadius = planetSize * 1.6

      // Create ring gradient
      const ringGradient = ctx.createRadialGradient(x, y, ringInnerRadius, x, y, ringOuterRadius)
      ringGradient.addColorStop(0, "rgba(200, 180, 140, 0.8)")
      ringGradient.addColorStop(0.3, "rgba(220, 200, 160, 0.6)")
      ringGradient.addColorStop(0.6, "rgba(180, 160, 120, 0.4)")
      ringGradient.addColorStop(1, "rgba(160, 140, 100, 0.2)")

      // Draw main ring
      ctx.strokeStyle = ringGradient
      ctx.lineWidth = (ringOuterRadius - ringInnerRadius) / cameraRef.current.zoom
      ctx.beginPath()
      ctx.arc(x, y, (ringInnerRadius + ringOuterRadius) / 2, 0, Math.PI * 2)
      ctx.stroke()

      // Draw ring divisions (Cassini Division)
      ctx.strokeStyle = "rgba(100, 80, 60, 0.8)"
      ctx.lineWidth = 2 / cameraRef.current.zoom
      ctx.beginPath()
      ctx.arc(x, y, ringMiddleRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Draw ring label
      ctx.fillStyle = "#ffffff"
      ctx.font = `${10 / cameraRef.current.zoom}px Arial`
      ctx.textAlign = "center"
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
      ctx.shadowBlur = 3
      ctx.fillText("Anillos", x, y + ringOuterRadius + 20 / cameraRef.current.zoom)
      ctx.shadowBlur = 0
    }

    // Animation loop
    const animate = () => {
      if (!isPaused) {
        timeRef.current += 0.001 * timeSpeed
      }

      // Smooth camera movement
      cameraRef.current.x += (cameraRef.current.targetX - cameraRef.current.x) * 0.1
      cameraRef.current.y += (cameraRef.current.targetY - cameraRef.current.y) * 0.1
      cameraRef.current.zoom += (cameraRef.current.targetZoom - cameraRef.current.zoom) * 0.1

      // Follow selected planet
      if (selectedPlanet && followPlanet && planetData[selectedPlanet]) {
        const data = planetData[selectedPlanet]
        if (selectedPlanet === "Sol") {
          cameraRef.current.targetX = 0
          cameraRef.current.targetY = 0
        } else {
          const angle = timeRef.current * data.speed
          cameraRef.current.targetX = -Math.cos(angle) * data.distance * 10
          cameraRef.current.targetY = -Math.sin(angle) * data.distance * 10
        }
      }

      // Clear canvas with semi-transparent background to show stars
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Save context
      ctx.save()

      // Apply camera transform
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom)
      ctx.translate(cameraRef.current.x, cameraRef.current.y)

      // Draw orbits
      if (showOrbits) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 1 / cameraRef.current.zoom

        Object.entries(planetData).forEach(([name, data]) => {
          if (name === "Sol") return

          ctx.beginPath()
          ctx.arc(0, 0, data.distance * 10, 0, Math.PI * 2)
          ctx.stroke()
        })
      }

      // Draw trajectories
      if (showTrajectories) {
        Object.entries(planetData).forEach(([name, data]) => {
          if (name === "Sol") return

          const points = trajectoryPointsRef.current[name] || []
          if (points.length > 1) {
            ctx.strokeStyle = data.color || "#ffffff"
            ctx.lineWidth = 2 / cameraRef.current.zoom
            ctx.globalAlpha = 0.6

            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y)
            }
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        })
      }

      // Draw sun
      const sunData = planetData["Sol"]

      // Sun glow (outer)
      const sunGlowGradient = ctx.createRadialGradient(0, 0, sunData.size * 8, 0, 0, sunData.size * 25)
      sunGlowGradient.addColorStop(0, "rgba(255, 255, 0, 0.3)")
      sunGlowGradient.addColorStop(0.5, "rgba(255, 200, 0, 0.1)")
      sunGlowGradient.addColorStop(1, "rgba(255, 255, 0, 0)")
      ctx.fillStyle = sunGlowGradient
      ctx.beginPath()
      ctx.arc(0, 0, sunData.size * 25, 0, Math.PI * 2)
      ctx.fill()

      // Sun corona (middle)
      const sunCoronaGradient = ctx.createRadialGradient(0, 0, sunData.size * 10, 0, 0, sunData.size * 15)
      sunCoronaGradient.addColorStop(0, "rgba(255, 255, 100, 0.5)")
      sunCoronaGradient.addColorStop(1, "rgba(255, 255, 0, 0)")
      ctx.fillStyle = sunCoronaGradient
      ctx.beginPath()
      ctx.arc(0, 0, sunData.size * 15, 0, Math.PI * 2)
      ctx.fill()

      // Sun surface
      const sunSurfaceGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, sunData.size * 10)
      sunSurfaceGradient.addColorStop(0, "#ffff80")
      sunSurfaceGradient.addColorStop(0.7, "#ffff00")
      sunSurfaceGradient.addColorStop(1, "#ffcc00")
      ctx.fillStyle = sunSurfaceGradient
      ctx.beginPath()
      ctx.arc(0, 0, sunData.size * 10, 0, Math.PI * 2)
      ctx.fill()

      // Draw planets
      Object.entries(planetData).forEach(([name, data]) => {
        if (name === "Sol") return

        const angle = timeRef.current * data.speed
        const x = Math.cos(angle) * data.distance * 10
        const y = Math.sin(angle) * data.distance * 10

        // Add to trajectory
        if (showTrajectories) {
          if (!trajectoryPointsRef.current[name]) {
            trajectoryPointsRef.current[name] = []
          }
          const points = trajectoryPointsRef.current[name]
          points.push({ x, y })
          if (points.length > 200) {
            points.shift()
          }
        }

        // Planet size
        const planetSize = showRealSizes ? data.realScale * 5 : data.size * 10

        // Planet color with lighting
        let planetColor = data.color
        if (showIllumination) {
          // Simple lighting based on distance from sun
          const distanceFromSun = Math.sqrt(x * x + y * y)
          const lightIntensity = Math.max(0.3, 1 - distanceFromSun / 500)
          const rgb = hexToRgb(data.color)
          if (rgb) {
            planetColor = `rgba(${Math.floor(rgb.r * lightIntensity)}, ${Math.floor(rgb.g * lightIntensity)}, ${Math.floor(rgb.b * lightIntensity)}, 1)`
          }
        }

        // Draw Saturn's rings before the planet
        if (name === "Saturno") {
          drawSaturnRings(ctx, x, y, planetSize)
        }

        // Draw planet with gradient for 3D effect
        const planetGradient = ctx.createRadialGradient(x - planetSize * 0.3, y - planetSize * 0.3, 0, x, y, planetSize)
        planetGradient.addColorStop(0, planetColor)
        planetGradient.addColorStop(1, darkenColor(planetColor, 0.3))

        ctx.fillStyle = planetGradient
        ctx.beginPath()
        ctx.arc(x, y, planetSize, 0, Math.PI * 2)
        ctx.fill()

        // Highlight selected planet
        if (selectedPlanet === name) {
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 3 / cameraRef.current.zoom
          ctx.beginPath()
          ctx.arc(x, y, planetSize + 5, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Draw planet label
        ctx.fillStyle = "#ffffff"
        ctx.font = `${12 / cameraRef.current.zoom}px Arial`
        ctx.textAlign = "center"
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
        ctx.shadowBlur = 3
        ctx.fillText(name, x, y + planetSize + 15 / cameraRef.current.zoom)
        ctx.shadowBlur = 0

        // Draw moons with better visibility
        if (showMoons && data.moons) {
          data.moons.forEach((moon) => {
            const moonAngle = timeRef.current * moon.speed
            const moonX = x + Math.cos(moonAngle) * moon.distance * 5
            const moonY = y + Math.sin(moonAngle) * moon.distance * 5

            // Moon with glow to distinguish from background stars
            const moonGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moon.size * 6)
            moonGradient.addColorStop(0, "#ffffff")
            moonGradient.addColorStop(0.3, "#cccccc")
            moonGradient.addColorStop(1, "rgba(200, 200, 200, 0)")

            ctx.fillStyle = moonGradient
            ctx.beginPath()
            ctx.arc(moonX, moonY, moon.size * 6, 0, Math.PI * 2)
            ctx.fill()

            // Moon surface
            ctx.fillStyle = "#cccccc"
            ctx.beginPath()
            ctx.arc(moonX, moonY, moon.size * 3, 0, Math.PI * 2)
            ctx.fill()

            // Moon label (only for major moons when zoomed in)
            if (cameraRef.current.zoom > 1.2) {
              ctx.fillStyle = "#ffffff"
              ctx.font = `${Math.max(4, 6 / cameraRef.current.zoom)}px Arial`
              ctx.textAlign = "center"
              ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
              ctx.shadowBlur = 1
              ctx.fillText(moon.name, moonX, moonY + moon.size * 3 + 4 / cameraRef.current.zoom)
              ctx.shadowBlur = 0
            }
          })
        }
      })

      // Restore context
      ctx.restore()

      // Draw UI info with better styling
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(10, 10, 200, 90)

      ctx.fillStyle = "#ffffff"
      ctx.font = "16px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Velocidad: ${timeSpeed}x`, 20, 35)
      ctx.fillText(`Zoom: ${cameraRef.current.zoom.toFixed(1)}x`, 20, 55)
      if (selectedPlanet) {
        ctx.fillText(`Seleccionado: ${selectedPlanet}`, 20, 75)
      }
      if (isPaused) {
        ctx.fillStyle = "#ffff00"
        ctx.fillText("PAUSADO", 20, 95)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("click", handleClick)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    timeSpeed,
    isPaused,
    showOrbits,
    showTrajectories,
    showRealSizes,
    showMoons,
    selectedPlanet,
    followPlanet,
    showIllumination,
  ])

  // Helper function to convert hex to RGB
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  // Helper function to darken a color
  function darkenColor(color: string, factor: number): string {
    const rgb = hexToRgb(color)
    if (!rgb) return color

    return `rgb(${Math.floor(rgb.r * (1 - factor))}, ${Math.floor(rgb.g * (1 - factor))}, ${Math.floor(rgb.b * (1 - factor))})`
  }

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-5" />
}
