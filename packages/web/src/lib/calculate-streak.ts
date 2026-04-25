function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function calculateStreakDays(
  isoDates: ReadonlyArray<string>,
  now: Date = new Date(),
): number {
  if (isoDates.length === 0) return 0

  const daysSet = new Set(
    isoDates.map((iso) => ymdLocal(new Date(iso))),
  )

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let cursor: Date
  if (daysSet.has(ymdLocal(today))) {
    cursor = today
  } else if (daysSet.has(ymdLocal(yesterday))) {
    cursor = yesterday
  } else {
    return 0
  }

  let count = 0
  while (daysSet.has(ymdLocal(cursor))) {
    count += 1
    const next = new Date(cursor)
    next.setDate(next.getDate() - 1)
    cursor = next
  }
  return count
}
