import { useUser } from '@clerk/clerk-react'

function getTimeGreeting(hour: number): string {
  if (hour < 5) return 'こんばんは'
  if (hour < 11) return 'おはよう'
  if (hour < 18) return 'こんにちは'
  return 'こんばんは'
}

export interface Greeting {
  text: string
  displayName: string | null
}

export function useGreeting(now: Date = new Date()): Greeting {
  const { user, isLoaded } = useUser()
  const text = getTimeGreeting(now.getHours())

  if (!isLoaded) {
    return { text, displayName: null }
  }

  const displayName =
    user?.firstName ?? user?.username ?? user?.fullName ?? null
  return { text, displayName }
}
