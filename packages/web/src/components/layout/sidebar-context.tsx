import { createContext, useContext } from 'react'

export interface SidebarContextValue {
  isExpanded: boolean
  isPinned: boolean
  setHovered: (hovered: boolean) => void
  togglePin: () => void
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error('useSidebarContext must be used within SidebarProvider')
  }
  return ctx
}
