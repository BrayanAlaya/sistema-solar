"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { planetData } from "@/lib/planet-data"

interface SolarSystem3DProps {
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

export function SolarSystem3D({
  timeSpeed,
  isPaused,
  showOrbits,
  showTrajectories,
  showRealSizes,
  showMoons,
  selectedPlanet,
  followPlanet,
  showIllumination,
}: SolarSystem3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
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

  useEffect(() => {
    if (!containerRef.current || isInitialized) return

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)
    camera.position.set(0, 50, 100)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 1000
    controlsRef.current = controls

    // Create 3D star field
    const createStarField = () => {
      const starGeometry = new THREE.BufferGeometry()
      const starCount = 2000
      const positions = new Float32Array(starCount * 3)
      const colors = new Float32Array(starCount * 3)

      for (let i = 0; i < starCount; i++) {
        // Random positions in a large sphere
        const radius = 2000 + Math.random() * 3000
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)

        // Random star colors (white, blue-white, yellow-white)
        const colorType = Math.random()
        if (colorType < 0.7) {
          colors[i * 3] = 1
          colors[i * 3 + 1] = 1
          colors[i * 3 + 2] = 1
        } else if (colorType < 0.9) {
          colors[i * 3] = 0.9
          colors[i * 3 + 1] = 0.95
          colors[i * 3 + 2] = 1
        } else {
          colors[i * 3] = 1
          colors[i * 3 + 1] = 0.95
          colors[i * 3 + 2] = 0.8
        }
      }

      starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

      const starMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
      })

      const stars = new THREE.Points(starGeometry, starMaterial)
      scene.add(stars)
    }

    createStarField()

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2)
    scene.add(ambientLight)

    // Sun light (point light)
    const sunLight = new THREE.PointLight(0xffffff, 2, 1000)
    sunLight.position.set(0, 0, 0)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    // Texture loader
    const textureLoader = new THREE.TextureLoader()

    // Create sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32)
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
    })

    // Add sun glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(7, 32, 32)
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
    })
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial)

    const sunGroup = new THREE.Group()
    const sun = new THREE.Mesh(sunGeometry, sunMaterial)
    sunGroup.add(sun)
    sunGroup.add(sunGlow)
    scene.add(sunGroup)
    planetsRef.current["Sol"] = sunGroup

    // Create planets
    Object.entries(planetData).forEach(([name, data]) => {
      if (name === "Sol") return

      // Planet geometry and material
      const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32)
      const planetMaterial = new THREE.MeshPhongMaterial({
        color: data.color,
        shininess: 30,
      })

      // Try to load texture (fallback to color if texture fails)
      textureLoader.load(
        `/textures/${data.texture}`,
        (texture) => {
          planetMaterial.map = texture
          planetMaterial.needsUpdate = true
        },
        undefined,
        () => {
          // Texture failed to load, keep the color
          console.warn(`Texture failed to load for ${name}: /textures/${data.texture}`)
        },
      )

      const planet = new THREE.Mesh(planetGeometry, planetMaterial)
      planet.castShadow = true
      planet.receiveShadow = true

      // Create planet group for easier manipulation
      const planetGroup = new THREE.Group()
      planetGroup.add(planet)

      // Add Saturn's rings
      if (name === "Saturno") {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 2.2, 64)
        const ringMaterial = new THREE.MeshPhongMaterial({
          color: 0xfab95b,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        })
        const rings = new THREE.Mesh(ringGeometry, ringMaterial)
        rings.rotation.x = Math.PI / 2
        planetGroup.add(rings)
      }

      scene.add(planetGroup)
      planetsRef.current[name] = planetGroup

      // Create orbit line
      const orbitGeometry = new THREE.BufferGeometry()
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.5,
      })
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
        transparent: true,
        opacity: 0.8,
      })
      const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial)
      scene.add(trajectory)
      trajectoriesRef.current[name] = trajectory
      trajectoryPointsRef.current[name] = []

      // Create moons
      if (data.moons && data.moons.length > 0) {
        data.moons.forEach((moon) => {
          const moonGeometry = new THREE.SphereGeometry(moon.size, 16, 16)
          const moonMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            shininess: 10,
          })

          // Try to load moon texture
          textureLoader.load(
            `/textures/${moon.texture}`,
            (texture) => {
              moonMaterial.map = texture
              moonMaterial.needsUpdate = true
            },
            undefined,
            () => {
              console.warn(`Moon texture failed to load: /textures/${moon.texture}`)
            },
          )

          const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial)
          moonMesh.castShadow = true
          moonMesh.receiveShadow = true
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

        // Get all planet meshes for intersection
        const planetMeshes: THREE.Object3D[] = []
        Object.entries(planetsRef.current).forEach(([name, planetGroup]) => {
          planetGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
              child.userData.planetName = name
              planetMeshes.push(child)
            }
          })
        })

        const intersects = raycaster.intersectObjects(planetMeshes)

        if (intersects.length > 0) {
          const clickedObject = intersects[0].object
          const planetName = clickedObject.userData.planetName

          if (planetName) {
            const event = new CustomEvent("planetSelected", {
              detail: { planetName },
            })
            window.dispatchEvent(event)
          }
        }
      }
    }

    window.addEventListener("click", handleClick)

    // Animation loop
    const animate = () => {
      if (!isPaused) {
        timeRef.current += 0.001 * timeSpeed
      }

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      // Update planets
      Object.entries(planetData).forEach(([name, data]) => {
        if (name === "Sol") {
          // Rotate sun
          const sun = planetsRef.current[name]
          if (sun) {
            sun.rotation.y = timeRef.current * 0.5
          }
          return
        }

        const planetGroup = planetsRef.current[name]
        if (!planetGroup) return

        // Calculate planet position
        const angle = timeRef.current * data.speed
        const x = Math.cos(angle) * data.distance
        const z = Math.sin(angle) * data.distance

        planetGroup.position.set(x, 0, z)

        // Rotate planet
        planetGroup.children[0].rotation.y = timeRef.current * data.rotationSpeed

        // Update planet size if needed
        if (showRealSizes) {
          planetGroup.scale.set(data.realScale / 10, data.realScale / 10, data.realScale / 10)
        } else {
          planetGroup.scale.set(1, 1, 1)
        }

        // Update trajectory
        if (showTrajectories) {
          const trajectoryPoints = trajectoryPointsRef.current[name] || []

          if (trajectoryPoints.length < 1000) {
            trajectoryPoints.push(new THREE.Vector3(x, 0, z))
            trajectoryPointsRef.current[name] = trajectoryPoints
          } else {
            trajectoryPoints.shift()
            trajectoryPoints.push(new THREE.Vector3(x, 0, z))
          }

          if (trajectoryPoints.length > 1) {
            const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints)
            trajectoriesRef.current[name].geometry.dispose()
            trajectoriesRef.current[name].geometry = trajectoryGeometry
          }
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
      if (selectedPlanet && followPlanet && controlsRef.current) {
        const planet = planetsRef.current[selectedPlanet]
        if (planet) {
          controlsRef.current.target.copy(planet.position)
        }
      }

      // Update lighting based on illumination setting
      if (sceneRef.current) {
        const ambientLight = sceneRef.current.children.find((child) => child instanceof THREE.AmbientLight) as
          | THREE.AmbientLight
          | undefined

        if (ambientLight) {
          ambientLight.intensity = showIllumination ? 0.1 : 0.4
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
        rendererRef.current.dispose()
      }

      // Dispose geometries and materials
      Object.values(planetsRef.current).forEach((planet) => {
        planet.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      })
    }
  }, [isInitialized])

  // Handle prop changes
  useEffect(() => {
    // Props are handled in the animation loop
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

  return <div ref={containerRef} className="w-full h-full" />
}
