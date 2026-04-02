import { useState, useCallback } from 'react'
import type { SidebarContextValue } from '@/components/layout/sidebar-context'

const STORAGE_KEY = 'sidebar-pinned'

function readPinned(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useSidebar(): SidebarContextValue {
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(readPinned)

  const isExpanded = isHovered || isPinned

  const setHovered = useCallback((hovered: boolean) => {
    setIsHovered(hovered)
  }, [])

  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  return { isExpanded, isPinned, setHovered, togglePin }
}
