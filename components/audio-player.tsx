"use client"

import { useEffect, useRef, useState } from "react"

interface AudioPlayerProps {
  enabled: boolean
  volume: number
}

export function AudioPlayer({ enabled, volume }: AudioPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Create Web Audio API context for generating ambient space sounds
    const createAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      return audioContextRef.current
    }

    // Create ambient space sound using Web Audio API
    const createAmbientSound = () => {
      const audioContext = createAudioContext()

      // Create oscillator for low-frequency ambient sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Configure oscillator for deep space ambience
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(40, audioContext.currentTime) // Low frequency

      // Configure gain for subtle volume
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Store references
      oscillatorRef.current = oscillator
      gainNodeRef.current = gainNode

      return { oscillator, gainNode }
    }

    // Add subtle frequency modulation for more realistic ambient sound
    const addFrequencyModulation = (oscillator: OscillatorNode, audioContext: AudioContext) => {
      const lfo = audioContext.createOscillator()
      const lfoGain = audioContext.createGain()

      lfo.type = "sine"
      lfo.frequency.setValueAtTime(0.1, audioContext.currentTime) // Very slow modulation
      lfoGain.gain.setValueAtTime(5, audioContext.currentTime) // Subtle frequency variation

      lfo.connect(lfoGain)
      lfoGain.connect(oscillator.frequency)

      lfo.start()

      return { lfo, lfoGain }
    }

    if (enabled && !isPlaying) {
      try {
        const audioContext = createAudioContext()

        // Resume audio context if suspended (required by browser policies)
        if (audioContext.state === "suspended") {
          audioContext.resume()
        }

        const { oscillator, gainNode } = createAmbientSound()

        // Add frequency modulation for more interesting sound
        addFrequencyModulation(oscillator, audioContext)

        // Fade in the ambient sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume * 0.1, audioContext.currentTime + 2)

        // Start the oscillator
        oscillator.start()
        setIsPlaying(true)
      } catch (error) {
        console.warn("Could not create ambient audio:", error)
      }
    } else if (!enabled && isPlaying) {
      // Stop and cleanup audio
      if (gainNodeRef.current && audioContextRef.current) {
        try {
          gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 1)

          setTimeout(() => {
            if (oscillatorRef.current) {
              try {
                oscillatorRef.current.stop()
              } catch (e) {
                // Oscillator might already be stopped
              }
              oscillatorRef.current = null
            }
            gainNodeRef.current = null
            setIsPlaying(false)
          }, 1000)
        } catch (error) {
          console.warn("Error stopping audio:", error)
          setIsPlaying(false)
        }
      }
    }

    // Update volume if playing
    if (isPlaying && gainNodeRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(volume * 0.1, audioContextRef.current!.currentTime)
      } catch (error) {
        console.warn("Error updating volume:", error)
      }
    }

    // Cleanup on unmount
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop()
        } catch (e) {
          // Oscillator might already be stopped
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // Context might already be closed
        }
      }
    }
  }, [enabled, volume, isPlaying])

  return null
}
