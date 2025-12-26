import { useState, useEffect, useRef, useCallback } from 'react'

export function useAudioAnalyzer(isActive) {
  const [volume, setVolume] = useState(0)
  const [frequencies, setFrequencies] = useState(new Array(32).fill(0))

  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const animationRef = useRef(null)

  const startAnalyzing = useCallback(async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create audio context and analyzer
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 64
      analyserRef.current.smoothingTimeConstant = 0.8

      // Connect microphone to analyzer
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Start analyzing
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const analyze = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate average volume (0-1)
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength
        setVolume(average / 255)

        // Get frequency bands for visualization
        setFrequencies(Array.from(dataArray).map(v => v / 255))

        animationRef.current = requestAnimationFrame(analyze)
      }

      analyze()
    } catch (error) {
      console.error('Audio analyzer error:', error)
    }
  }, [])

  const stopAnalyzing = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setVolume(0)
    setFrequencies(new Array(32).fill(0))
  }, [])

  useEffect(() => {
    if (isActive) {
      startAnalyzing()
    } else {
      stopAnalyzing()
    }

    return () => stopAnalyzing()
  }, [isActive, startAnalyzing, stopAnalyzing])

  return { volume, frequencies }
}
