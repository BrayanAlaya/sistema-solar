"use client"

import { useEffect, useRef } from "react"
import { planetData } from "@/lib/planet-data"

interface WebGLSolarSystemProps {
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

export function WebGLSolarSystem({
  timeSpeed,
  isPaused,
  showOrbits,
  showTrajectories,
  showRealSizes,
  showMoons,
  selectedPlanet,
  followPlanet,
  showIllumination,
}: WebGLSolarSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const cameraRef = useRef({
    x: 0,
    y: 30,
    z: 80,
    rotX: 0,
    rotY: 0,
    distance: 80, // Distance from target
    targetX: 0,
    targetY: 0,
    targetZ: 0,
  })
  const mouseRef = useRef({
    isDown: false,
    lastX: 0,
    lastY: 0,
  })
  const trajectoryPointsRef = useRef<Record<string, { x: number; y: number; z: number }[]>>({})
  const starsRef = useRef<{ x: number; y: number; z: number; brightness: number }[]>([])
  const texturesRef = useRef<Record<string, HTMLImageElement>>({})
  const texturesLoadedRef = useRef<Record<string, boolean>>({})

  // Initialize stars once
  const initializeStars = () => {
    if (starsRef.current.length > 0) return

    const stars = []
    for (let i = 0; i < 800; i++) {
      // Use spherical coordinates for uniform distribution
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u // Azimuthal angle
      const phi = Math.acos(2 * v - 1) // Polar angle

      const radius = 300 + Math.random() * 500 // Distance from center
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      stars.push({
        x,
        y,
        z,
        brightness: 0.3 + Math.random() * 0.7,
      })
    }
    starsRef.current = stars
  }

  // Load textures
  const loadTextures = () => {
    const textureNames = [
      "sol.jpg",
      "mercurio.jpg",
      "venus.jpg",
      "tierra.jpg",
      "marte.jpg",
      "jupiter.jpg",
      "saturno.jpg",
      "urano.jpg",
      "neptuno.jpg",
    ]

    textureNames.forEach((textureName) => {
      if (!texturesLoadedRef.current[textureName]) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          texturesRef.current[textureName] = img
          texturesLoadedRef.current[textureName] = true
          console.log(`Texture loaded: ${textureName}`)
        }
        img.onerror = () => {
          console.warn(`Failed to load texture: ${textureName}`)
          texturesLoadedRef.current[textureName] = false
        }
        img.src = `/textures/${textureName}`
      }
    })
  }

  // Update camera position based on spherical coordinates
  const updateCameraPosition = () => {
    const camera = cameraRef.current

    // Calculate camera position using spherical coordinates around target
    camera.x = camera.targetX + Math.cos(camera.rotY) * Math.cos(camera.rotX) * camera.distance
    camera.y = camera.targetY + Math.sin(camera.rotX) * camera.distance
    camera.z = camera.targetZ + Math.sin(camera.rotY) * Math.cos(camera.rotX) * camera.distance
  }

  // Helper function to safely parse hex color
  const parseHexColor = (color: string): { r: number; g: number; b: number } => {
    // Remove # if present
    let hex = color.replace("#", "")

    // Ensure we have a valid 6-character hex string
    if (hex.length === 3) {
      // Convert 3-char hex to 6-char (e.g., "abc" -> "aabbcc")
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }

    if (hex.length !== 6) {
      // Invalid hex, return white as fallback
      return { r: 255, g: 255, b: 255 }
    }

    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Validate parsed values
    return {
      r: isNaN(r) ? 255 : r,
      g: isNaN(g) ? 255 : g,
      b: isNaN(b) ? 255 : b,
    }
  }

  // Helper function to apply lighting to a color
  const applyLighting = (color: string, lightIntensity: number): string => {
    const rgb = parseHexColor(color)

    // Ensure lightIntensity is valid
    const intensity = isNaN(lightIntensity) ? 1 : Math.max(0, Math.min(1, lightIntensity))

    const r = Math.floor(Math.max(0, Math.min(255, rgb.r * intensity)))
    const g = Math.floor(Math.max(0, Math.min(255, rgb.g * intensity)))
    const b = Math.floor(Math.max(0, Math.min(255, rgb.b * intensity)))

    return `rgb(${r}, ${g}, ${b})`
  }

  // Improved 3D projection with better handling
  const project3D = (x: number, y: number, z: number, camera: typeof cameraRef.current, canvas: HTMLCanvasElement) => {
    // Calculate view direction
    const viewDirX = camera.targetX - camera.x
    const viewDirY = camera.targetY - camera.y
    const viewDirZ = camera.targetZ - camera.z
    const viewLength = Math.sqrt(viewDirX * viewDirX + viewDirY * viewDirY + viewDirZ * viewDirZ)

    if (viewLength === 0) return null

    // Normalize view direction
    const forwardX = viewDirX / viewLength
    const forwardY = viewDirY / viewLength
    const forwardZ = viewDirZ / viewLength

    // Calculate right vector (cross product of forward and up)
    const upX = 0,
      upY = 1,
      upZ = 0
    const rightX = forwardY * upZ - forwardZ * upY
    const rightY = forwardZ * upX - forwardX * upZ
    const rightZ = forwardX * upY - forwardY * upX
    const rightLength = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ)

    if (rightLength === 0) return null

    const normalizedRightX = rightX / rightLength
    const normalizedRightY = rightY / rightLength
    const normalizedRightZ = rightZ / rightLength

    // Calculate actual up vector
    const actualUpX = normalizedRightY * forwardZ - normalizedRightZ * forwardY
    const actualUpY = normalizedRightZ * forwardX - normalizedRightX * forwardZ
    const actualUpZ = normalizedRightX * forwardY - normalizedRightY * forwardX

    // Transform point to camera space
    const dx = x - camera.x
    const dy = y - camera.y
    const dz = z - camera.z

    // Project onto camera axes
    const camX = dx * normalizedRightX + dy * normalizedRightY + dz * normalizedRightZ
    const camY = dx * actualUpX + dy * actualUpY + dz * actualUpZ
    const camZ = dx * forwardX + dy * forwardY + dz * forwardZ

    // Perspective projection with very close near plane
    const nearClip = 0.1
    if (camZ <= nearClip) return null

    const fov = Math.PI / 3 // 60 degrees
    const aspect = canvas.width / canvas.height
    const scale = canvas.height / 2 / Math.tan(fov / 2)

    const screenX = canvas.width / 2 + (camX * scale) / camZ
    const screenY = canvas.height / 2 - (camY * scale) / camZ

    return {
      x: screenX,
      y: screenY,
      scale: scale / camZ,
      depth: camZ,
    }
  }

  // Draw a circle (planet) in 3D space with texture
  const drawPlanet = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    z: number,
    radius: number,
    color: string,
    textureName: string,
    camera: typeof cameraRef.current,
    canvas: HTMLCanvasElement,
    showIllumination = false,
  ) => {
    const projected = project3D(x, y, z, camera, canvas)
    if (!projected) return

    const size = radius * projected.scale
    if (size < 0.1) return // Too small to see

    let finalColor = color

    // Apply lighting if enabled
    if (showIllumination) {
      // Calculate distance from sun (0,0,0)
      const distanceFromSun = Math.sqrt(x * x + y * y + z * z)

      // Calculate lighting intensity based on distance from sun
      // Closer planets get more light, farther planets get less
      const maxDistance = 200 // Maximum distance for lighting calculation
      const lightIntensity = Math.max(0.2, Math.min(1.0, 1.0 - distanceFromSun / maxDistance))

      // Apply lighting to color using the safe function
      finalColor = applyLighting(color, lightIntensity)
    }

    // Try to use texture if available
    const texture = texturesRef.current[textureName]
    if (texture && texturesLoadedRef.current[textureName]) {
      try {
        // Save context
        ctx.save()

        // Create clipping path for the planet
        ctx.beginPath()
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2)
        ctx.clip()

        // Draw texture - simplified approach
        const textureSize = size * 2

        // Special handling for Earth texture (flip vertically)
        if (textureName === "tierra.jpg") {
          ctx.translate(projected.x, projected.y)
          ctx.scale(1, -1) // Flip vertically
          ctx.drawImage(texture, -textureSize / 2, -textureSize / 2, textureSize, textureSize)
        } else {
          // Normal texture drawing for other planets
          ctx.drawImage(texture, projected.x - textureSize / 2, projected.y - textureSize / 2, textureSize, textureSize)
        }

        // Restore context
        ctx.restore()

        // Add lighting overlay if enabled
        if (showIllumination) {
          const gradient = ctx.createRadialGradient(
            projected.x - size * 0.3,
            projected.y - size * 0.3,
            0,
            projected.x,
            projected.y,
            size,
          )
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)")
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.3)")

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      } catch (error) {
        console.warn(`Error drawing texture for ${textureName}:`, error)
        // Fallback to gradient if texture fails
        drawGradientPlanet(ctx, projected, size, finalColor)
      }
    } else {
      // Fallback to gradient if texture not loaded
      drawGradientPlanet(ctx, projected, size, finalColor)
    }

    return { projected, size }
  }

  // Helper function to draw gradient planet (fallback)
  const drawGradientPlanet = (
    ctx: CanvasRenderingContext2D,
    projected: { x: number; y: number },
    size: number,
    color: string,
  ) => {
    const gradient = ctx.createRadialGradient(
      projected.x - size * 0.3,
      projected.y - size * 0.3,
      0,
      projected.x,
      projected.y,
      size,
    )

    gradient.addColorStop(0, color)
    gradient.addColorStop(1, darkenColor(color, 0.5))

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw Saturn's rings
  const drawSaturnRings = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    z: number,
    planetRadius: number,
    camera: typeof cameraRef.current,
    canvas: HTMLCanvasElement,
  ) => {
    const projected = project3D(x, y, z, camera, canvas)
    if (!projected) return

    const scale = projected.scale
    const centerX = projected.x
    const centerY = projected.y

    // Ring dimensions (relative to planet size)
    const innerRadius = planetRadius * scale * 1.3
    const outerRadius = planetRadius * scale * 2.2
    const middleRadius = planetRadius * scale * 1.75

    // Draw multiple ring layers for better visibility
    const ringLayers = [
      { radius: innerRadius + (outerRadius - innerRadius) * 0.2, opacity: 0.8, color: "rgba(200, 180, 140, 0.8)" },
      { radius: innerRadius + (outerRadius - innerRadius) * 0.4, opacity: 0.6, color: "rgba(220, 200, 160, 0.6)" },
      { radius: innerRadius + (outerRadius - innerRadius) * 0.6, opacity: 0.7, color: "rgba(180, 160, 120, 0.7)" },
      { radius: innerRadius + (outerRadius - innerRadius) * 0.8, opacity: 0.5, color: "rgba(160, 140, 100, 0.5)" },
    ]

    // Draw ring shadow on planet (behind)
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, outerRadius, outerRadius * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Draw main ring structure
    ringLayers.forEach((layer) => {
      ctx.save()
      ctx.strokeStyle = layer.color
      ctx.lineWidth = Math.max(1, (outerRadius - innerRadius) / 8)
      ctx.globalAlpha = layer.opacity

      // Draw ring as ellipse for 3D perspective
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, layer.radius, layer.radius * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    })

    // Draw Cassini Division (gap between rings)
    ctx.save()
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)"
    ctx.lineWidth = Math.max(1, (outerRadius - innerRadius) / 12)
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, middleRadius, middleRadius * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // Eliminar esta sección completa (líneas aproximadamente 400-415):
    // Add ring particles effect for close-up view
    // if (scale > 0.5) {
    //   const particleCount = Math.min(50, Math.floor(scale * 30))
    //   for (let i = 0; i < particleCount; i++) {
    //     const angle = (i / particleCount) * Math.PI * 2
    //     const ringRadius = innerRadius + Math.random() * (outerRadius - innerRadius)
    //     const particleX = centerX + Math.cos(angle) * ringRadius
    //     const particleY = centerY + Math.sin(angle) * ringRadius * 0.3

    //     ctx.fillStyle = `rgba(200, 180, 140, ${0.3 + Math.random() * 0.4})`
    //     ctx.beginPath()
    //     ctx.arc(particleX, particleY, Math.max(0.5, scale * 0.8), 0, Math.PI * 2)
    //     ctx.fill()
    //   }
    // }
  }

  // Draw orbit ring
  const drawOrbit = (
    ctx: CanvasRenderingContext2D,
    radius: number,
    camera: typeof cameraRef.current,
    canvas: HTMLCanvasElement,
  ) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()

    let firstPoint = true
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const projected = project3D(x, 0, z, camera, canvas)

      if (projected) {
        if (firstPoint) {
          ctx.moveTo(projected.x, projected.y)
          firstPoint = false
        } else {
          ctx.lineTo(projected.x, projected.y)
        }
      }
    }
    ctx.stroke()
  }

  // Draw trajectory line
  const drawTrajectory = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; z: number }[],
    color: string,
    camera: typeof cameraRef.current,
    canvas: HTMLCanvasElement,
  ) => {
    if (points.length < 2) return

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    ctx.setLineDash([5, 5]) // Línea punteada para mejor visibilidad
    ctx.beginPath()

    let firstPoint = true
    let pointsDrawn = 0

    for (const point of points) {
      const projected = project3D(point.x, point.y, point.z, camera, canvas)
      if (projected && projected.depth > 0) {
        if (firstPoint) {
          ctx.moveTo(projected.x, projected.y)
          firstPoint = false
        } else {
          ctx.lineTo(projected.x, projected.y)
        }
        pointsDrawn++
      }
    }

    if (pointsDrawn > 1) {
      ctx.stroke()
    }

    ctx.setLineDash([]) // Reset line dash
    ctx.globalAlpha = 1
  }

  // Draw stars with improved size and distribution
  const drawStars = (ctx: CanvasRenderingContext2D, camera: typeof cameraRef.current, canvas: HTMLCanvasElement) => {
    starsRef.current.forEach((star) => {
      const projected = project3D(star.x, star.y, star.z, camera, canvas)
      if (projected && projected.depth > 0) {
        // Much smaller stars with distance-based sizing
        const baseSize = 0.8
        const size = Math.max(0.3, Math.min(2, baseSize * (1 / Math.sqrt(projected.scale))))

        // Vary opacity based on brightness and distance
        const opacity = star.brightness * Math.min(1, projected.scale * 2)

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  // Helper function to darken colors safely
  const darkenColor = (color: string, factor: number): string => {
    // Handle RGB format
    if (color.startsWith("rgb(")) {
      const match = color.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/)
      if (match) {
        const r = Math.floor(Number.parseInt(match[1]) * (1 - factor))
        const g = Math.floor(Number.parseInt(match[2]) * (1 - factor))
        const b = Math.floor(Number.parseInt(match[3]) * (1 - factor))
        return `rgb(${r}, ${g}, ${b})`
      }
    }

    // Handle hex format
    const rgb = parseHexColor(color)
    const r = Math.floor(rgb.r * (1 - factor))
    const g = Math.floor(rgb.g * (1 - factor))
    const b = Math.floor(rgb.b * (1 - factor))
    return `rgb(${r}, ${g}, ${b})`
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize stars and load textures
    initializeStars()
    loadTextures()

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Mouse controls
    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true
      mouseRef.current.lastX = e.clientX
      mouseRef.current.lastY = e.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return

      const deltaX = e.clientX - mouseRef.current.lastX
      const deltaY = e.clientY - mouseRef.current.lastY

      cameraRef.current.rotY += deltaX * 0.01
      cameraRef.current.rotX -= deltaY * 0.01

      // Allow full rotation but limit extreme angles
      cameraRef.current.rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraRef.current.rotX))

      updateCameraPosition()

      mouseRef.current.lastX = e.clientX
      mouseRef.current.lastY = e.clientY
    }

    const handleMouseUp = () => {
      mouseRef.current.isDown = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9
      cameraRef.current.distance *= zoomFactor

      // Allow much closer zoom - from 1 unit to 500 units
      cameraRef.current.distance = Math.max(1, Math.min(500, cameraRef.current.distance))

      updateCameraPosition()
    }

    const handleClick = (e: MouseEvent) => {
      // Simple planet selection based on screen position
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // Check each planet
      Object.entries(planetData).forEach(([name, data]) => {
        let planetX = 0,
          planetY = 0,
          planetZ = 0

        if (name !== "Sol") {
          const angle = timeRef.current * data.speed
          planetX = Math.cos(angle) * data.distance * 5
          planetZ = Math.sin(angle) * data.distance * 5
        }

        const projected = project3D(planetX, planetY, planetZ, cameraRef.current, canvas)
        if (projected) {
          const distance = Math.sqrt((clickX - projected.x) ** 2 + (clickY - projected.y) ** 2)
          const planetSize = (showRealSizes ? data.realScale : data.size) * projected.scale

          if (distance < Math.max(5, planetSize)) {
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

    // Animation loop
    const animate = () => {
      if (!isPaused) {
        timeRef.current += 0.001 * timeSpeed
      }

      // Follow selected planet
      if (selectedPlanet && followPlanet && planetData[selectedPlanet]) {
        const data = planetData[selectedPlanet]
        if (selectedPlanet === "Sol") {
          cameraRef.current.targetX = 0
          cameraRef.current.targetY = 0
          cameraRef.current.targetZ = 0
        } else {
          const angle = timeRef.current * data.speed
          cameraRef.current.targetX = Math.cos(angle) * data.distance * 5
          cameraRef.current.targetY = 0
          cameraRef.current.targetZ = Math.sin(angle) * data.distance * 5
        }
        updateCameraPosition()
      }

      // Clear canvas with space background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#000011")
      gradient.addColorStop(0.5, "#000008")
      gradient.addColorStop(1, "#000011")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw stars first (background)
      drawStars(ctx, cameraRef.current, canvas)

      // Draw orbits
      if (showOrbits) {
        Object.entries(planetData).forEach(([name, data]) => {
          if (name === "Sol") return
          drawOrbit(ctx, data.distance * 5, cameraRef.current, canvas)
        })
      }

      // Collect all objects to draw (for depth sorting)
      const objects: Array<{
        name: string
        x: number
        y: number
        z: number
        radius: number
        color: string
        texture: string
        depth: number
        type: "planet" | "moon"
      }> = []

      // Add sun
      const sunData = planetData["Sol"]
      const sunProjected = project3D(0, 0, 0, cameraRef.current, canvas)
      if (sunProjected) {
        objects.push({
          name: "Sol",
          x: 0,
          y: 0,
          z: 0,
          radius: sunData.size * 3, // Make sun bigger
          color: sunData.color,
          texture: sunData.texture,
          depth: sunProjected.depth,
          type: "planet",
        })
      }

      // Add planets and moons
      Object.entries(planetData).forEach(([name, data]) => {
        if (name === "Sol") return

        const angle = timeRef.current * data.speed
        const x = Math.cos(angle) * data.distance * 5
        const z = Math.sin(angle) * data.distance * 5

        const projected = project3D(x, 0, z, cameraRef.current, canvas)
        if (projected) {
          const radius = showRealSizes ? data.realScale * 2 : data.size * 2
          objects.push({
            name,
            x,
            y: 0,
            z,
            radius,
            color: data.color,
            texture: data.texture,
            depth: projected.depth,
            type: "planet",
          })

          // Update trajectory - mejorado
          if (showTrajectories) {
            if (!trajectoryPointsRef.current[name]) {
              trajectoryPointsRef.current[name] = []
            }
            const points = trajectoryPointsRef.current[name]

            // Add current position every few frames to avoid too many points
            if (points.length === 0 || timeRef.current % 0.1 < 0.001) {
              points.push({ x, y: 0, z })
              if (points.length > 100) {
                // Limit trajectory length
                points.shift()
              }
            }

            // Draw trajectory if we have enough points
            if (points.length > 1) {
              drawTrajectory(ctx, points, data.color, cameraRef.current, canvas)
            }
          }

          // Add moons
          if (showMoons && data.moons) {
            data.moons.forEach((moon) => {
              const moonAngle = timeRef.current * moon.speed
              const moonX = x + Math.cos(moonAngle) * moon.distance * 2
              const moonZ = z + Math.sin(moonAngle) * moon.distance * 2

              const moonProjected = project3D(moonX, 0, moonZ, cameraRef.current, canvas)
              if (moonProjected) {
                objects.push({
                  name: `${name}-${moon.name}`,
                  x: moonX,
                  y: 0,
                  z: moonZ,
                  radius: moon.size * 2,
                  color: "#cccccc",
                  texture: moon.texture,
                  depth: moonProjected.depth,
                  type: "moon",
                })
              }
            })
          }
        }
      })

      // Sort by depth (far to near)
      objects.sort((a, b) => b.depth - a.depth)

      // Draw all objects
      objects.forEach((obj) => {
        // Draw Saturn's rings before the planet (so they appear behind)
        if (obj.name === "Saturno") {
          drawSaturnRings(ctx, obj.x, obj.y, obj.z, obj.radius, cameraRef.current, canvas)
        }

        const result = drawPlanet(
          ctx,
          obj.x,
          obj.y,
          obj.z,
          obj.radius,
          obj.color,
          obj.texture,
          cameraRef.current,
          canvas,
          showIllumination,
        )

        // Draw Saturn's rings after the planet (so they appear in front)
        if (obj.name === "Saturno" && result) {
          // Draw front part of rings
          ctx.save()
          ctx.globalCompositeOperation = "source-over"
          drawSaturnRings(ctx, obj.x, obj.y, obj.z, obj.radius, cameraRef.current, canvas)
          ctx.restore()
        }

        // Draw labels for planets
        if (result && obj.type === "planet") {
          ctx.fillStyle = "#ffffff"
          ctx.font = "14px Arial"
          ctx.textAlign = "center"
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
          ctx.shadowBlur = 3
          ctx.fillText(obj.name, result.projected.x, result.projected.y + result.size + 15)
          ctx.shadowBlur = 0

          // Highlight selected planet
          if (selectedPlanet === obj.name) {
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(result.projected.x, result.projected.y, result.size + 5, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        // Draw labels for moons (always visible with adaptive sizing)
        if (result && obj.type === "moon") {
          const moonName = obj.name.split("-")[1] // Extract moon name from "Planet-Moon" format

          ctx.fillStyle = "#cccccc"
          ctx.font = `${Math.max(6, Math.min(12, 8 / Math.sqrt(cameraRef.current.distance / 80)))}px Arial`
          ctx.textAlign = "center"
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)"
          ctx.shadowBlur = 2
          ctx.fillText(moonName, result.projected.x, result.projected.y + result.size + 8)
          ctx.shadowBlur = 0
        }
      })

      // Draw UI info
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(10, 10, 320, 180)

      ctx.fillStyle = "#ffffff"
      ctx.font = "16px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Velocidad: ${timeSpeed}x`, 20, 35)
      ctx.fillText(`Distancia: ${cameraRef.current.distance.toFixed(1)}`, 20, 55)
      ctx.fillText(`Iluminación: ${showIllumination ? "Realista" : "Uniforme"}`, 20, 75)
      ctx.fillText(
        `Rotación: X=${((cameraRef.current.rotX * 180) / Math.PI).toFixed(0)}° Y=${((cameraRef.current.rotY * 180) / Math.PI).toFixed(0)}°`,
        20,
        95,
      )
      ctx.fillText(
        `Cámara: (${cameraRef.current.x.toFixed(1)}, ${cameraRef.current.y.toFixed(1)}, ${cameraRef.current.z.toFixed(1)})`,
        20,
        115,
      )
      ctx.fillText(
        `Objetivo: (${cameraRef.current.targetX.toFixed(1)}, ${cameraRef.current.targetY.toFixed(1)}, ${cameraRef.current.targetZ.toFixed(1)})`,
        20,
        135,
      )

      // Show texture loading status
      const totalTextures = Object.keys(texturesLoadedRef.current).length
      const loadedTextures = Object.values(texturesLoadedRef.current).filter(Boolean).length
      ctx.fillText(`Texturas: ${loadedTextures}/${totalTextures}`, 20, 155)

      if (selectedPlanet) {
        ctx.fillText(`Seleccionado: ${selectedPlanet}`, 20, 175)
      }
      if (isPaused) {
        ctx.fillStyle = "#ffff00"
        ctx.fillText("PAUSADO", 250, 35)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("click", handleClick)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
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

  return <canvas ref={canvasRef} className="w-full h-full" />
}
