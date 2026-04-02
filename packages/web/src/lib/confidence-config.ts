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
    bgClass: 'bg-confidence-1-muted',
    textClass: 'text-confidence-1-foreground',
    borderClass: 'border-confidence-1/30',
  },
  {
    level: 2,
    label: 'やや不安',
    bgClass: 'bg-confidence-2-muted',
    textClass: 'text-confidence-2-foreground',
    borderClass: 'border-confidence-2/30',
  },
  {
    level: 3,
    label: 'まあまあ',
    bgClass: 'bg-confidence-3-muted',
    textClass: 'text-confidence-3-foreground',
    borderClass: 'border-confidence-3/30',
  },
  {
    level: 4,
    label: '完璧',
    bgClass: 'bg-confidence-4-muted',
    textClass: 'text-confidence-4-foreground',
    borderClass: 'border-confidence-4/30',
  },
] as const

export function getConfidenceConfig(
  level: number,
): ConfidenceLevelConfig | undefined {
  return confidenceLevels.find((c) => c.level === level)
}
