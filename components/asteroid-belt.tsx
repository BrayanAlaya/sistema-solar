interface Asteroid {
  x: number
  z: number
  size: number
  speed: number
  color: string
}

const generateAsteroidBelt = (): Asteroid[] => {
  const asteroids: Asteroid[] = []
  
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 15 + Math.random() * 5 // Entre Marte y Júpiter
    
    asteroids.push({
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      size: 0.1 + Math.random() * 0.3,
      speed: 0.001 + Math.random() * 0.0005,
      color: `hsl(${30 + Math.random() * 40}, 70%, 50%)`
    })
  }
  
  return asteroids
}