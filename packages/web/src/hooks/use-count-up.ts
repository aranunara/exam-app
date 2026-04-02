import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

interface UseCountUpParams {
  end: number
  duration?: number
  delay?: number
  enabled?: boolean
  decimals?: number
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function useCountUp({
  end,
  duration = 800,
  delay = 0,
  enabled = true,
  decimals = 0,
}: UseCountUpParams): number {
  const [value, setValue] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return
    if (prefersReducedMotion) {
      setValue(end)
      return
    }

    const timeoutId = setTimeout(() => {
      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutCubic(progress)
        const factor = 10 ** decimals
        setValue(Math.round(eased * end * factor) / factor)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(rafRef.current)
    }
  }, [end, duration, delay, enabled, decimals, prefersReducedMotion])

  return value
}
