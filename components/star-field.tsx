"use client"

import { useEffect, useRef } from "react"

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initializeStars() // Reinitialize stars when canvas resizes
    }

    // Create different types of stars
    let stars: {
      x: number
      y: number
      size: number
      opacity: number
      baseOpacity: number
      speed: number
      twinkleSpeed: number
      twinkleDirection: number
      color: { r: number; g: number; b: number }
      type: "small" | "medium" | "large" | "distant"
    }[] = []

    const initializeStars = () => {
      stars = []

      // Create background stars (small and distant)
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 0.8 + 0.3,
          opacity: Math.random() * 0.4 + 0.1,
          baseOpacity: Math.random() * 0.4 + 0.1,
          speed: Math.random() * 0.005 + 0.001,
          twinkleSpeed: Math.random() * 0.002 + 0.0005,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
          color: { r: 255, g: 255, b: 255 },
          type: "distant",
        })
      }

      // Create medium stars
      for (let i = 0; i < 80; i++) {
        const isBlueish = Math.random() > 0.8
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.8,
          opacity: Math.random() * 0.6 + 0.3,
          baseOpacity: Math.random() * 0.6 + 0.3,
          speed: Math.random() * 0.008 + 0.002,
          twinkleSpeed: Math.random() * 0.004 + 0.001,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
          color: isBlueish ? { r: 230, g: 243, b: 255 } : { r: 255, g: 255, b: 255 },
          type: "medium",
        })
      }

      // Create bright stars
      for (let i = 0; i < 30; i++) {
        const colorTypes = [
          { r: 255, g: 255, b: 255 }, // White
          { r: 255, g: 248, b: 220 }, // Cream
          { r: 230, g: 243, b: 255 }, // Blue-white
          { r: 255, g: 228, b: 225 }, // Pink-white
        ]
        const selectedColor = colorTypes[Math.floor(Math.random() * colorTypes.length)]

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 1.2,
          opacity: Math.random() * 0.8 + 0.4,
          baseOpacity: Math.random() * 0.8 + 0.4,
          speed: Math.random() * 0.01 + 0.003,
          twinkleSpeed: Math.random() * 0.006 + 0.002,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
          color: selectedColor,
          type: "large",
        })
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Animation
    const animate = () => {
      // Clear canvas with space background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#000011")
      gradient.addColorStop(0.5, "#000008")
      gradient.addColorStop(1, "#000011")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        // Update star position (slow drift)
        star.y += star.speed
        if (star.y > canvas.height + 10) {
          star.y = -10
          star.x = Math.random() * canvas.width
        }

        // Update star twinkle
        star.opacity += star.twinkleSpeed * star.twinkleDirection
        const maxOpacity = star.baseOpacity * 1.5
        const minOpacity = star.baseOpacity * 0.3

        if (star.opacity > maxOpacity) {
          star.opacity = maxOpacity
          star.twinkleDirection = -1
        } else if (star.opacity < minOpacity) {
          star.opacity = minOpacity
          star.twinkleDirection = 1
        }

        // Draw star based on type
        if (star.type === "distant") {
          // Simple dots for distant stars
          ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.opacity})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // More detailed stars for closer ones
          // Add glow effect
          const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          glowGradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.opacity})`)
          glowGradient.addColorStop(
            0.3,
            `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.opacity * 0.5})`,
          )
          glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          ctx.fill()

          // Draw the bright center
          ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.opacity})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 0.6, 0, Math.PI * 2)
          ctx.fill()

          // Add sparkle effect for larger stars
          if (star.type === "large") {
            const sparkleLength = star.size * 2.5
            ctx.strokeStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.opacity * 0.6})`
            ctx.lineWidth = 0.5
            ctx.beginPath()

            // Main cross
            ctx.moveTo(star.x - sparkleLength, star.y)
            ctx.lineTo(star.x + sparkleLength, star.y)
            ctx.moveTo(star.x, star.y - sparkleLength)
            ctx.lineTo(star.x, star.y + sparkleLength)

            // Diagonal sparkles
            const diagLength = sparkleLength * 0.7
            ctx.moveTo(star.x - diagLength, star.y - diagLength)
            ctx.lineTo(star.x + diagLength, star.y + diagLength)
            ctx.moveTo(star.x - diagLength, star.y + diagLength)
            ctx.lineTo(star.x + diagLength, star.y - diagLength)

            ctx.stroke()
          }
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
}
