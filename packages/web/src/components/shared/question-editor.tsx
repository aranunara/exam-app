import { useState } from 'react'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { Collapsible } from '@/components/shared/collapsible'
import { ToggleSwitch } from '@/components/shared/toggle-switch'
import { ConfidenceSelector, ConfidenceBadge } from '@/components/shared/confidence-selector'
import type { ConfidenceLevel } from '@/lib/confidence-config'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

export interface ChoiceFormData {
  id?: string
  body: string
  isCorrect: boolean
  explanation: string
  sortOrder: number
}

export interface QuestionFormData {
  id?: string
  body: string
  explanation: string
  isMultiAnswer: boolean
  sortOrder: number
  choices: ChoiceFormData[]
  tagIds: string[]
}

export function createEmptyChoice(sortOrder: number): ChoiceFormData {
  return {
    body: '',
    isCorrect: false,
    explanation: '',
    sortOrder,
  }
}

export function createEmptyQuestion(sortOrder: number): QuestionFormData {
  return {
    body: '',
    explanation: '',
    isMultiAnswer: false,
    sortOrder,
    choices: [createEmptyChoice(0), createEmptyChoice(1)],
    tagIds: [],
  }
}

function ChoiceEditor({
  choice,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  choice: ChoiceFormData
  index: number
  onChange: (updated: ChoiceFormData) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          選択肢 {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...choice, isCorrect: !choice.isCorrect })}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
              choice.isCorrect
                ? 'bg-success-muted text-success-foreground ring-1 ring-success/30'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {choice.isCorrect && (
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            正解
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-destructive hover:underline"
            >
              削除
            </button>
          )}
        </div>
      </div>
      <textarea
        value={choice.body}
        onChange={(e) => onChange({ ...choice, body: e.target.value })}
        placeholder="選択肢のテキスト（Markdown対応）"
        aria-label={`選択肢 ${index + 1} のテキスト`}
        rows={2}
        className="mb-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        type="text"
        value={choice.explanation}
        onChange={(e) =>
          onChange({ ...choice, explanation: e.target.value })
        }
        placeholder="解説（任意）"
        aria-label={`選択肢 ${index + 1} の解説`}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

function truncate(text: string, max: number): string {
  const singleLine = text.replace(/\n/g, ' ').trim()
  if (singleLine.length <= max) return singleLine
  return singleLine.slice(0, max) + '…'
}

export function QuestionEditor({
  question,
  index,
  totalQuestions,
  availableTags,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSave,
  saveStatus,
  isOpen,
  onOpenChange,
  collapsedSummary,
  confidenceLevel,
  onConfidenceChange,
}: {
  question: QuestionFormData
  index: number
  totalQuestions: number
  availableTags: Tag[]
  onChange: (updated: QuestionFormData) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onSave?: () => void
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  collapsedSummary?: string
  confidenceLevel?: ConfidenceLevel
  onConfidenceChange?: (level: ConfidenceLevel) => void
}) {
  const [showPreview, setShowPreview] = useState(false)

  function handleChoiceChange(choiceIndex: number, updated: ChoiceFormData) {
    const newChoices = question.choices.map((c, i) =>
      i === choiceIndex ? updated : c,
    )
    const isMultiAnswer = newChoices.filter((c) => c.isCorrect).length > 1
    onChange({ ...question, choices: newChoices, isMultiAnswer })
  }

  function handleRemoveChoice(choiceIndex: number) {
    const newChoices = question.choices
      .filter((_, i) => i !== choiceIndex)
      .map((c, i) => ({ ...c, sortOrder: i }))
    const isMultiAnswer = newChoices.filter((c) => c.isCorrect).length > 1
    onChange({ ...question, choices: newChoices, isMultiAnswer })
  }

  function handleAddChoice() {
    const newChoices = [
      ...question.choices,
      createEmptyChoice(question.choices.length),
    ]
    onChange({ ...question, choices: newChoices })
  }

  function handleTagToggle(tagId: string) {
    const newTagIds = question.tagIds.includes(tagId)
      ? question.tagIds.filter((id) => id !== tagId)
      : [...question.tagIds, tagId]
    onChange({ ...question, tagIds: newTagIds })
  }

  const collapsible = isOpen !== undefined && onOpenChange !== undefined
  const summary =
    collapsedSummary ?? (question.body ? truncate(question.body, 60) : '')

  const header = (
    <span className="flex items-center gap-2">
      問題 {index + 1}
      {saveStatus === 'saving' && (
        <span className="text-xs font-normal text-muted-foreground animate-pulse">
          保存中...
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="flex items-center gap-1 text-xs font-normal text-success-foreground">
          <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          保存済み
        </span>
      )}
      {saveStatus === 'error' && (
        <span className="flex items-center gap-1 text-xs font-normal text-destructive">
          保存失敗
          {onSave && (
            <button type="button" onClick={onSave} className="ml-1 underline hover:no-underline">
              再試行
            </button>
          )}
        </span>
      )}
    </span>
  )

  const headerActions = (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={index === 0}
        onClick={onMoveUp}
        className="rounded border px-2 py-1 text-xs transition-colors hover:bg-muted disabled:opacity-30"
        title="上へ移動"
      >
        &#9650;
      </button>
      <button
        type="button"
        disabled={index === totalQuestions - 1}
        onClick={onMoveDown}
        className="rounded border px-2 py-1 text-xs transition-colors hover:bg-muted disabled:opacity-30"
        title="下へ移動"
      >
        &#9660;
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded border border-destructive/50 px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
      >
        削除
      </button>
    </span>
  )

  const body = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:hidden">
        <button
          type="button"
          disabled={index === 0}
          onClick={onMoveUp}
          className="inline-flex h-10 items-center gap-1 rounded border px-3 text-xs transition-colors hover:bg-muted disabled:opacity-30"
          title="上へ移動"
        >
          &#9650; 上へ
        </button>
        <button
          type="button"
          disabled={index === totalQuestions - 1}
          onClick={onMoveDown}
          className="inline-flex h-10 items-center gap-1 rounded border px-3 text-xs transition-colors hover:bg-muted disabled:opacity-30"
          title="下へ移動"
        >
          &#9660; 下へ
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-10 items-center rounded border border-destructive/50 px-3 text-xs text-destructive transition-colors hover:bg-destructive/10"
        >
          削除
        </button>
      </div>

      {question.id && confidenceLevel !== undefined && (
        <ConfidenceSelector
          questionId={question.id}
          currentLevel={confidenceLevel}
          onLevelChange={onConfidenceChange}
        />
      )}

      <div className="flex items-center gap-4">
        {question.isMultiAnswer && (
          <span className="inline-flex items-center rounded-full bg-info-muted px-2.5 py-0.5 text-xs font-medium text-info-foreground">
            複数回答（正解が2つ以上）
          </span>
        )}
        <ToggleSwitch
          checked={showPreview}
          onChange={setShowPreview}
          label="プレビュー"
          size="sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          問題文
        </label>
        <textarea
          value={question.body}
          onChange={(e) =>
            onChange({ ...question, body: e.target.value })
          }
          placeholder="問題文（Markdown対応）"
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {showPreview && question.body && (
          <div className="mt-2 rounded-md border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              プレビュー
            </p>
            <MarkdownRenderer content={question.body} />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">解説</label>
        <textarea
          value={question.explanation}
          onChange={(e) =>
            onChange({ ...question, explanation: e.target.value })
          }
          placeholder="回答後に表示される解説（Markdown対応）"
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {showPreview && question.explanation && (
          <div className="mt-2 rounded-md border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              プレビュー
            </p>
            <MarkdownRenderer content={question.explanation} />
          </div>
        )}
      </div>

      {availableTags.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium">タグ</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = question.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'border bg-background hover:bg-muted'
                  }`}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">選択肢</label>
          <button
            type="button"
            onClick={handleAddChoice}
            className="rounded border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
          >
            選択肢を追加
          </button>
        </div>
        <div className="space-y-2">
          {question.choices.map((choice, ci) => (
            <ChoiceEditor
              key={ci}
              choice={choice}
              index={ci}
              onChange={(updated) => handleChoiceChange(ci, updated)}
              onRemove={() => handleRemoveChoice(ci)}
              canRemove={question.choices.length > 2}
            />
          ))}
        </div>
      </div>

    </div>
  )

  if (collapsible) {
    const hasConfidence = confidenceLevel != null && confidenceLevel > 0
    const collapsedBadge = !isOpen && (summary || hasConfidence) ? (
      <span className="flex min-w-0 items-center gap-2">
        {hasConfidence && (
          <span className="shrink-0"><ConfidenceBadge level={confidenceLevel} /></span>
        )}
        {summary && (
          <span className="min-w-0 truncate text-sm font-normal text-muted-foreground">
            {summary}
          </span>
        )}
      </span>
    ) : undefined

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={onOpenChange}
        title={header}
        badge={collapsedBadge}
        actions={headerActions}
      >
        {body}
      </Collapsible>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card p-5')}>
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold">{header}</h4>
        <div className="flex items-center gap-2">{headerActions}</div>
      </div>
      {body}
    </div>
  )
}
