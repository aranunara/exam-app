import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import {
  confidenceLevels,
  getConfidenceConfig,
  type ConfidenceLevel,
} from '@/lib/confidence-config'
import type { ApiResponse } from '@/types'

interface ConfidenceSelectorProps {
  questionId: string
  currentLevel: ConfidenceLevel
  onLevelChange?: (level: ConfidenceLevel) => void
}

export function ConfidenceSelector({
  questionId,
  currentLevel,
  onLevelChange,
}: ConfidenceSelectorProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (level: ConfidenceLevel) =>
      api.put<ApiResponse<{ questionId: string; level: number }>>(
        '/confidence',
        { questionId, level },
      ),
    onMutate: async (newLevel) => {
      onLevelChange?.(newLevel)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.confidence.byQuestion(questionId),
      })
    },
  })

  const handleClick = (level: ConfidenceLevel) => {
    const nextLevel: ConfidenceLevel = currentLevel === level ? 0 : level
    mutation.mutate(nextLevel)
  }

  return (
    <div className="flex items-center gap-2 sm:gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">自信度:</span>
      {confidenceLevels.map((config) => {
        const isActive = currentLevel === config.level

        return (
          <button
            key={config.level}
            type="button"
            onClick={() => handleClick(config.level as ConfidenceLevel)}
            disabled={mutation.isPending}
            className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors active:scale-95 motion-safe:transition-transform motion-safe:duration-150 disabled:opacity-50 sm:px-2 sm:py-1 ${
              isActive
                ? `${config.bgClass} ${config.textClass} ${config.borderClass}`
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

interface ConfidenceBadgeProps {
  level: number
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const config = getConfidenceConfig(level)
  if (!config) return null

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.bgClass} ${config.textClass}`}
    >
      {config.label}
    </span>
  )
}
