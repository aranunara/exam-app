export function calculateScorePercent(
  correctCount: number,
  totalQuestions: number,
): number {
  if (totalQuestions === 0) return 0
  return Math.round((correctCount / totalQuestions) * 100)
}

export function isPassing(scorePercent: number, passScore: number): boolean {
  return scorePercent >= passScore
}
