import { useEffect, useRef } from 'react'
import './FireVolumeArc.css'

function FireVolumeArc({ volume = 0, frequencies = [], isSpeaking, isListening, isActive }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const volumeRef = useRef(volume || 0)
  const smoothedVolumeRef = useRef(volume || 0)
  const speakingRef = useRef(isSpeaking)
  const listeningRef = useRef(isListening)

  // Track the latest values without restarting the animation loop
  useEffect(() => {
    volumeRef.current = volume || 0
  }, [volume])

  useEffect(() => {
    speakingRef.current = isSpeaking
  }, [isSpeaking])

  useEffect(() => {
    listeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const particleCount = 110

    class Particle {
      constructor(x, spread) {
        this.baseX = x
        this.spread = spread
        this.reset()
      }

      reset() {
        this.x = this.baseX + (Math.random() - 0.5) * this.spread * 2
        this.y = canvas.height
        this.size = Math.random() * 12 + 4
        this.speedY = Math.random() * 2 + 1
        this.speedX = (Math.random() - 0.5) * 1
        this.life = 1
        this.decay = Math.random() * 0.02 + 0.015
        // Fire colors based on state
        if (speakingRef.current) {
          this.hue = Math.random() * 30 + 10 // Red to orange
        } else {
          this.hue = Math.random() * 40 + 180 // Cyan to blue
        }
      }

      update(volumeMultiplier) {
        // Volume affects how high particles go
        const maxHeight = 40 + volumeMultiplier * 170

        this.y -= this.speedY * (0.5 + volumeMultiplier)
        this.x += this.speedX + Math.sin(this.y * 0.05) * 0.5
        this.life -= this.decay
        this.size *= 0.98

        // Reset if dead or too high
        if (this.life <= 0 || this.y < canvas.height - maxHeight) {
          this.reset()
        }
      }

      draw(ctx, intensity) {
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        )

        const alpha = this.life * intensity
        gradient.addColorStop(0, `hsla(${this.hue + 15}, 100%, 70%, ${alpha})`)
        gradient.addColorStop(0.4, `hsla(${this.hue}, 100%, 50%, ${alpha * 0.8})`)
        gradient.addColorStop(1, `hsla(${this.hue - 10}, 100%, 30%, 0)`)

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    const seedParticles = () => {
      particlesRef.current = []
      const width = canvas.width || 720
      const radius = width * 0.45
      const spread = Math.max(18, width * 0.035)
      const arcStart = Math.PI * 1.12 // ~202deg
      const arcEnd = Math.PI * 1.88  // ~338deg
      const arcSpan = arcEnd - arcStart

      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount
        // Slight jitter per particle to avoid rigid alignment
        const jitter = (Math.random() - 0.5) * 0.06
        const angle = arcStart + t * arcSpan + jitter
        const x = width / 2 + Math.cos(angle) * radius
        particlesRef.current.push(new Particle(x, spread))
      }
    }

    // Set canvas size for bottom arc
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      canvas.width = rect?.width || 720
      canvas.height = Math.max(180, (canvas.width || 720) * 0.28)
      seedParticles()
    }

    // Animation loop
    let animationId
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get current volume and smooth it for steadier visuals
      const currentVolume = Math.max(0, Math.min(1, volumeRef.current || 0))
      const smoothed = smoothedVolumeRef.current * 0.82 + currentVolume * 0.18
      smoothedVolumeRef.current = smoothed
      const intensity = 0.35 + smoothed * 0.65

      ctx.globalCompositeOperation = 'lighter'

      particlesRef.current.forEach(p => {
        // Update hue based on current state
        if (speakingRef.current && p.hue > 100) {
          p.hue = Math.random() * 30 + 10
        } else if (listeningRef.current && !speakingRef.current && p.hue < 100) {
          p.hue = Math.random() * 40 + 180
        }

        p.update(smoothed)
        p.draw(ctx, intensity)
      })

      ctx.globalCompositeOperation = 'source-over'
      animationId = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="fire-volume-arc">
      <canvas ref={canvasRef} className="fire-canvas" />
    </div>
  )
}

export default FireVolumeArc
