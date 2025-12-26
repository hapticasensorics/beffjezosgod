import { useEffect, useRef } from 'react'
import './FireEffect.css'

function FireEffect({ position = 'left', intensity = 'low' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size
    const resize = () => {
      canvas.width = 150
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Fire particles
    const particles = []
    const particleCount = intensity === 'high' ? 80 : 40

    class Particle {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 20
        this.size = Math.random() * 15 + 5
        this.speedY = Math.random() * 3 + 2
        this.speedX = (Math.random() - 0.5) * 2
        this.life = 1
        this.decay = Math.random() * 0.02 + 0.01
        // Fire colors: yellow -> orange -> red
        this.hue = Math.random() * 40 + 10 // 10-50 (red to yellow)
      }

      update() {
        this.y -= this.speedY
        this.x += this.speedX + Math.sin(this.y * 0.02) * 0.5
        this.life -= this.decay
        this.size *= 0.98

        if (this.life <= 0 || this.y < 0) {
          this.reset()
        }
      }

      draw() {
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        )

        const alpha = this.life * 0.8
        gradient.addColorStop(0, `hsla(${this.hue + 20}, 100%, 70%, ${alpha})`)
        gradient.addColorStop(0.4, `hsla(${this.hue}, 100%, 50%, ${alpha * 0.8})`)
        gradient.addColorStop(1, `hsla(${this.hue - 10}, 100%, 30%, 0)`)

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const p = new Particle()
      p.y = Math.random() * canvas.height // Spread initially
      particles.push(p)
    }

    // Animation loop
    let animationId
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add glow effect
      ctx.globalCompositeOperation = 'lighter'

      particles.forEach(p => {
        p.update()
        p.draw()
      })

      ctx.globalCompositeOperation = 'source-over'

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`fire-effect fire-${position} intensity-${intensity}`}
    />
  )
}

export default FireEffect
