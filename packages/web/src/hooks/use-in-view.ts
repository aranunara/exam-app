import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

interface UseInViewParams {
  threshold?: number
  once?: boolean
  rootMargin?: string
}

export function useInView({
  threshold = 0.1,
  once = true,
  rootMargin = '0px 0px -50px 0px',
}: UseInViewParams = {}): { ref: (node: Element | null) => void; inView: boolean } {
  const [inView, setInView] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const nodeRef = useRef<Element | null>(null)

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
  }, [])

  const ref = useCallback(
    (node: Element | null) => {
      cleanup()
      nodeRef.current = node

      if (prefersReducedMotion) {
        setInView(true)
        return
      }

      if (!node) return

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) cleanup()
          }
        },
        { threshold, rootMargin },
      )
      observerRef.current.observe(node)
    },
    [threshold, rootMargin, once, prefersReducedMotion, cleanup],
  )

  useEffect(() => cleanup, [cleanup])

  return { ref, inView }
}
