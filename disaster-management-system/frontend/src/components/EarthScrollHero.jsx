import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 240

function framePath(index) {
  const n = String(index + 1).padStart(4, '0')
  return `/earth-frames/frame_${n}.jpg`
}

export default function EarthScrollHero() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const framesRef = useRef([])
  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const images = []
    let loaded = 0
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.src = framePath(i)
      img.onload = () => {
        loaded++
        setLoadProgress(Math.round((loaded / FRAME_COUNT) * 100))
        if (loaded === FRAME_COUNT) setReady(true)
      }
      images.push(img)
    }
    framesRef.current = images
  }, [])

  useEffect(() => {
    if (!ready || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const frames = framesRef.current

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const render = (index) => {
      const img = frames[Math.min(FRAME_COUNT - 1, Math.max(0, index))]
      if (!img?.complete) return
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (canvas.width - w) / 2
      const y = (canvas.height - h) / 2
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, x, y, w, h)
    }

    render(0)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=400%',
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const idx = Math.floor(self.progress * (FRAME_COUNT - 1))
          render(idx)
        },
      },
    })

    return () => {
      window.removeEventListener('resize', resize)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      tl.kill()
    }
  }, [ready])

  return (
    <section id="hero" ref={containerRef} className="relative h-screen bg-cinematic-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-cinematic-black">
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="mt-4 text-body text-sm">Loading Earth sequence {loadProgress}%</p>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-cinematic-black/80 z-[1]" />
      <div className="absolute bottom-24 left-0 right-0 z-[2] text-center px-4 pointer-events-none">
        <p className="text-xs tracking-[0.4em] text-accent-blue uppercase mb-4">Smart Disaster Platform</p>
        <h1 className="text-5xl md:text-8xl font-bold text-headline tracking-tight leading-none">
          CONNECTED.
        </h1>
        <p className="mt-4 text-xl text-body max-w-xl mx-auto">
          One digital nervous system for disaster alerts, shelters, and rescue coordination.
        </p>
        <a
          href="#about"
          className="inline-block mt-8 px-8 py-3 rounded-full bg-accent-blue text-white font-medium pointer-events-auto hover:shadow-glow transition-shadow"
        >
          Explore Platform
        </a>
      </div>
    </section>
  )
}
