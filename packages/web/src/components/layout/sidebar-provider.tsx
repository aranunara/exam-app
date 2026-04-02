import type { ReactNode } from 'react'
import { SidebarContext } from './sidebar-context'
import { useSidebar } from '@/hooks/use-sidebar'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const sidebar = useSidebar()

  return (
    <SidebarContext.Provider value={sidebar}>
      {children}
    </SidebarContext.Provider>
  )
}
