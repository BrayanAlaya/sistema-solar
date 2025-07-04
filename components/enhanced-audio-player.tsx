"use client"

import { useEffect, useRef, useState } from "react"

interface EnhancedAudioPlayerProps {
  enabled: boolean
  volume: number
}

export function EnhancedAudioPlayer({ enabled, volume }: EnhancedAudioPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const gainNodesRef = useRef<GainNode[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  // Crear audio sintético espacial
  const createSpaceAmbientAudio = () => {
    try {
      // Crear contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      // Reanudar contexto si está suspendido
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      // Limpiar arrays
      oscillatorsRef.current = []
      gainNodesRef.current = []

      // Configuración de capas de sonido ambiente espacial
      const ambientLayers = [
        // Capa base profunda
        {
          frequency: 32,
          gain: 0.03,
          filterFreq: 150,
          lfoFreq: 0.03,
          lfoDepth: 1,
        },
        // Capa media
        {
          frequency: 64,
          gain: 0.025,
          filterFreq: 300,
          lfoFreq: 0.05,
          lfoDepth: 2,
        },
        // Capa alta sutil
        {
          frequency: 128,
          gain: 0.015,
          filterFreq: 500,
          lfoFreq: 0.07,
          lfoDepth: 3,
        },
        // Capa de "viento cósmico"
        {
          frequency: 200,
          gain: 0.008,
          filterFreq: 800,
          lfoFreq: 0.02,
          lfoDepth: 5,
        },
      ]

      ambientLayers.forEach((layer, index) => {
        // Crear oscilador principal
        const oscillator = audioContext.createOscillator()
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(layer.frequency, audioContext.currentTime)

        // Crear nodo de ganancia
        const gainNode = audioContext.createGain()
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)

        // Crear filtro pasa-bajos para suavizar
        const filter = audioContext.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(layer.filterFreq, audioContext.currentTime)
        filter.Q.setValueAtTime(0.5, audioContext.currentTime)

        // Crear LFO para modulación de frecuencia
        const lfo = audioContext.createOscillator()
        const lfoGain = audioContext.createGain()
        lfo.type = "sine"
        lfo.frequency.setValueAtTime(layer.lfoFreq, audioContext.currentTime)
        lfoGain.gain.setValueAtTime(layer.lfoDepth, audioContext.currentTime)

        // Crear LFO para modulación de amplitud (tremolo sutil)
        const tremoloLfo = audioContext.createOscillator()
        const tremoloGain = audioContext.createGain()
        tremoloLfo.type = "sine"
        tremoloLfo.frequency.setValueAtTime(layer.lfoFreq * 0.7, audioContext.currentTime)
        tremoloGain.gain.setValueAtTime(0.1, audioContext.currentTime)

        // Conectar modulación de frecuencia
        lfo.connect(lfoGain)
        lfoGain.connect(oscillator.frequency)

        // Conectar modulación de amplitud
        tremoloLfo.connect(tremoloGain)
        tremoloGain.connect(gainNode.gain)

        // Conectar cadena principal de audio
        oscillator.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Iniciar osciladores
        oscillator.start()
        lfo.start()
        tremoloLfo.start()

        // Fade in gradual con diferentes tiempos para cada capa
        const fadeInTime = 2 + index * 0.5
        gainNode.gain.linearRampToValueAtTime(layer.gain * volume, audioContext.currentTime + fadeInTime)

        // Guardar referencias
        oscillatorsRef.current.push(oscillator, lfo, tremoloLfo)
        gainNodesRef.current.push(gainNode)
      })

      // Añadir efectos adicionales ocasionales
      setTimeout(() => {
        if (audioContextRef.current && isPlaying) {
          addCosmicEffects(audioContext)
        }
      }, 5000)

      setIsPlaying(true)
      console.log("Space ambient audio created successfully")
    } catch (error) {
      console.error("Failed to create space ambient audio:", error)
    }
  }

  // Añadir efectos cósmicos ocasionales
  const addCosmicEffects = (audioContext: AudioContext) => {
    const addRandomTone = () => {
      if (!audioContext || audioContext.state === "closed") return

      try {
        // Crear tono sutil ocasional
        const effectOsc = audioContext.createOscillator()
        const effectGain = audioContext.createGain()
        const effectFilter = audioContext.createBiquadFilter()

        // Configurar oscilador
        const frequencies = [220, 330, 440, 660, 880]
        const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)]
        effectOsc.frequency.setValueAtTime(randomFreq, audioContext.currentTime)
        effectOsc.type = "sine"

        // Configurar ganancia (muy sutil)
        effectGain.gain.setValueAtTime(0, audioContext.currentTime)
        effectGain.gain.linearRampToValueAtTime(0.005 * volume, audioContext.currentTime + 1)
        effectGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 3)

        // Configurar filtro
        effectFilter.type = "lowpass"
        effectFilter.frequency.setValueAtTime(800, audioContext.currentTime)
        effectFilter.Q.setValueAtTime(2, audioContext.currentTime)

        // Conectar
        effectOsc.connect(effectFilter)
        effectFilter.connect(effectGain)
        effectGain.connect(audioContext.destination)

        // Iniciar y detener
        effectOsc.start()
        effectOsc.stop(audioContext.currentTime + 3)

        // Programar siguiente efecto
        const nextEffectTime = 10000 + Math.random() * 20000 // 10-30 segundos
        setTimeout(addRandomTone, nextEffectTime)
      } catch (error) {
        console.warn("Error adding cosmic effect:", error)
      }
    }

    // Iniciar efectos
    addRandomTone()
  }

  // Detener audio
  const stopAudio = () => {
    if (audioContextRef.current && isPlaying) {
      try {
        // Fade out gradual
        gainNodesRef.current.forEach((gainNode, index) => {
          if (gainNode && audioContextRef.current) {
            gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 1)
          }
        })

        // Detener osciladores después del fade out
        setTimeout(() => {
          oscillatorsRef.current.forEach((oscillator) => {
            try {
              oscillator.stop()
            } catch (e) {
              // Oscillator might already be stopped
            }
          })

          // Limpiar referencias
          oscillatorsRef.current = []
          gainNodesRef.current = []
          setIsPlaying(false)

          // Cerrar contexto
          if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
          }
        }, 1000)
      } catch (error) {
        console.warn("Error stopping audio:", error)
        setIsPlaying(false)
      }
    }
  }

  // Actualizar volumen
  const updateVolume = (newVolume: number) => {
    if (audioContextRef.current && isPlaying) {
      try {
        gainNodesRef.current.forEach((gainNode, index) => {
          if (gainNode) {
            // Diferentes niveles base para cada capa
            const baseLevels = [0.03, 0.025, 0.015, 0.008]
            const targetGain = baseLevels[index] * newVolume
            gainNode.gain.setValueAtTime(targetGain, audioContextRef.current!.currentTime)
          }
        })
      } catch (error) {
        console.warn("Error updating volume:", error)
      }
    }
  }

  // Efecto principal
  useEffect(() => {
    if (enabled && !isPlaying) {
      createSpaceAmbientAudio()
    } else if (!enabled && isPlaying) {
      stopAudio()
    }
  }, [enabled, isPlaying])

  // Actualizar volumen cuando cambie
  useEffect(() => {
    if (isPlaying) {
      updateVolume(volume)
    }
  }, [volume, isPlaying])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopAudio()
      }
    }
  }, [])

  return null
}
