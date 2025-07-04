"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { planetData } from "@/lib/planet-data"

interface SolarSystemProps {
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

export function SolarSystem({
  timeSpeed,
  isPaused,
  showOrbits,
  showTrajectories,
  showRealSizes,
  showMoons,
  selectedPlanet,
  followPlanet,
  showIllumination,
}: SolarSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const planetsRef = useRef<Record<string, THREE.Object3D>>({})
  const moonsRef = useRef<Record<string, THREE.Object3D>>({})
  const orbitsRef = useRef<Record<string, THREE.Line>>({})
  const trajectoriesRef = useRef<Record<string, THREE.Line>>({})
  const trajectoryPointsRef = useRef<Record<string, THREE.Vector3[]>>({})
  const timeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 20, 30)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333)
    scene.add(ambientLight)

    // Add point light (sun)
    const sunLight = new THREE.PointLight(0xffffff, 1.5)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    // Create sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32)
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("/textures/sun.jpg"),
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
    })
    const sun = new THREE.Mesh(sunGeometry, sunMaterial)
    scene.add(sun)
    planetsRef.current["Sol"] = sun

    // Create planets
    Object.entries(planetData).forEach(([name, data]) => {
      if (name === "Sol") return // Skip sun as it's already created

      // Create planet
      const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32)
      const planetMaterial = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load(`/textures/${data.texture}`),
        shininess: 5,
      })
      const planet = new THREE.Mesh(planetGeometry, planetMaterial)
      scene.add(planet)
      planetsRef.current[name] = planet

      // Create orbit
      const orbitGeometry = new THREE.BufferGeometry()
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 })
      const orbitPoints = []
      const segments = 128

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * data.distance, 0, Math.sin(theta) * data.distance))
      }

      orbitGeometry.setFromPoints(orbitPoints)
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial)
      scene.add(orbit)
      orbitsRef.current[name] = orbit

      // Initialize trajectory
      const trajectoryGeometry = new THREE.BufferGeometry()
      const trajectoryMaterial = new THREE.LineBasicMaterial({
        color: data.color || 0xffffff,
      })
      const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial)
      scene.add(trajectory)
      trajectoriesRef.current[name] = trajectory
      trajectoryPointsRef.current[name] = []

      // Create moons if any
      if (data.moons && data.moons.length > 0) {
        data.moons.forEach((moon) => {
          const moonGeometry = new THREE.SphereGeometry(moon.size, 16, 16)
          const moonMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load(`/textures/${moon.texture}`),
            shininess: 5,
          })
          const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial)
          scene.add(moonMesh)
          moonsRef.current[`${name}-${moon.name}`] = moonMesh
        })
      }
    })

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    // Handle planet selection via click
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      if (cameraRef.current && sceneRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current)
        const intersects = raycaster.intersectObjects(Object.values(planetsRef.current))

        if (intersects.length > 0) {
          const clickedObject = intersects[0].object
          const planetName = Object.entries(planetsRef.current).find(([_, obj]) => obj === clickedObject)?.[0]

          if (planetName) {
            // Dispatch a custom event that will be caught by the React component
            const event = new CustomEvent("planetSelected", {
              detail: { planetName },
            })
            window.dispatchEvent(event)
          }
        }
      }
    }

    window.addEventListener("click", handleClick)

    // Start animation
    const animate = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      // Update time
      timeRef.current += 0.001 * timeSpeed

      // Update planets
      Object.entries(planetData).forEach(([name, data]) => {
        if (name === "Sol") return // Skip sun

        const planet = planetsRef.current[name]
        if (!planet) return

        // Calculate planet position
        const angle = timeRef.current * data.speed
        const x = Math.cos(angle) * data.distance
        const z = Math.sin(angle) * data.distance

        planet.position.set(x, 0, z)
        planet.rotation.y = timeRef.current * data.rotationSpeed

        // Update planet size if needed
        if (showRealSizes) {
          planet.scale.set(data.realScale, data.realScale, data.realScale)
        } else {
          planet.scale.set(1, 1, 1)
        }

        // Update trajectory
        if (showTrajectories) {
          const trajectoryPoints = trajectoryPointsRef.current[name] || []

          // Add current position to trajectory
          if (trajectoryPoints.length < 1000) {
            // Limit number of points
            trajectoryPoints.push(new THREE.Vector3(x, 0, z))
            trajectoryPointsRef.current[name] = trajectoryPoints
          } else {
            trajectoryPoints.shift() // Remove oldest point
            trajectoryPoints.push(new THREE.Vector3(x, 0, z))
          }

          // Update trajectory line
          const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints)
          trajectoriesRef.current[name].geometry.dispose()
          trajectoriesRef.current[name].geometry = trajectoryGeometry
        }

        // Update moons
        if (data.moons && showMoons) {
          data.moons.forEach((moon) => {
            const moonMesh = moonsRef.current[`${name}-${moon.name}`]
            if (moonMesh) {
              const moonAngle = timeRef.current * moon.speed
              const moonX = x + Math.cos(moonAngle) * moon.distance
              const moonZ = z + Math.sin(moonAngle) * moon.distance
              moonMesh.position.set(moonX, 0, moonZ)
              moonMesh.rotation.y = timeRef.current * moon.rotationSpeed
              moonMesh.visible = true
            }
          })
        } else if (data.moons) {
          data.moons.forEach((moon) => {
            const moonMesh = moonsRef.current[`${name}-${moon.name}`]
            if (moonMesh) {
              moonMesh.visible = false
            }
          })
        }
      })

      // Update orbit visibility
      Object.entries(orbitsRef.current).forEach(([name, orbit]) => {
        orbit.visible = showOrbits
      })

      // Update trajectory visibility
      Object.entries(trajectoriesRef.current).forEach(([name, trajectory]) => {
        trajectory.visible = showTrajectories
      })

      // Follow selected planet if enabled
      if (selectedPlanet && followPlanet && cameraRef.current && controlsRef.current) {
        const planet = planetsRef.current[selectedPlanet]
        if (planet) {
          controlsRef.current.target.copy(planet.position)
        }
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    setIsInitialized(true)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("click", handleClick)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [isInitialized])

  // Handle changes to props
  useEffect(() => {
    // Update illumination
    if (sceneRef.current) {
      const ambientLight = sceneRef.current.children.find((child) => child instanceof THREE.AmbientLight) as
        | THREE.AmbientLight
        | undefined

      if (ambientLight) {
        ambientLight.intensity = showIllumination ? 0.3 : 1.0
      }
    }
  }, [showIllumination])

  // Handle planet selection from outside
  useEffect(() => {
    const handlePlanetSelected = (e: CustomEvent<{ planetName: string }>) => {
      const planetName = e.detail.planetName
      // This will be caught by the parent component
      const event = new CustomEvent("planetSelected", {
        detail: { planetName },
      })
      window.dispatchEvent(event)
    }

    window.addEventListener("planetSelected" as any, handlePlanetSelected as any)

    return () => {
      window.removeEventListener("planetSelected" as any, handlePlanetSelected as any)
    }
  }, [])

  // Listen for planet selection events from the Three.js scene
  useEffect(() => {
    const handlePlanetSelected = (e: CustomEvent<{ planetName: string }>) => {
      // This is handled by the parent component
    }

    window.addEventListener("planetSelected" as any, handlePlanetSelected as any)

    return () => {
      window.removeEventListener("planetSelected" as any, handlePlanetSelected as any)
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
