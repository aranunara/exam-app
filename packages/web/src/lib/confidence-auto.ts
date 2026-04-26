import type { ConfidenceLevel } from './confidence-config'

export function calculateAutoConfidence(
  previousLevel: ConfidenceLevel,
  isCorrect: boolean,
): ConfidenceLevel {
  if (!isCorrect) return 1
  if (previousLevel === 0) return 2
  return Math.min(4, previousLevel + 1) as ConfidenceLevel
}
