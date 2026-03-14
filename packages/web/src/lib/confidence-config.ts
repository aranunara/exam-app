export type ConfidenceLevel = 0 | 1 | 2 | 3 | 4

export interface ConfidenceLevelConfig {
  level: ConfidenceLevel
  label: string
  bgClass: string
  textClass: string
  borderClass: string
}

export const confidenceLevels: readonly ConfidenceLevelConfig[] = [
  {
    level: 1,
    label: '自信なし',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-300 dark:border-red-800',
  },
  {
    level: 2,
    label: 'やや不安',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-300 dark:border-orange-800',
  },
  {
    level: 3,
    label: 'まあまあ',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-300 dark:border-blue-800',
  },
  {
    level: 4,
    label: '完璧',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-300 dark:border-green-800',
  },
] as const

export function getConfidenceConfig(
  level: number,
): ConfidenceLevelConfig | undefined {
  return confidenceLevels.find((c) => c.level === level)
}
