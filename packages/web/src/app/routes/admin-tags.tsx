import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import type { ApiResponse, Tag } from '@/types'

/* ─── Constants ─── */

const COLOR_PALETTE = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#10B981', label: 'Emerald' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
  { value: '#64748B', label: 'Slate' },
] as const

/* ─── Form types ─── */

interface TagFormData {
  name: string
  color: string
}

const EMPTY_FORM: TagFormData = {
  name: '',
  color: COLOR_PALETTE[0].value,
}

function tagToForm(tag: Tag): TagFormData {
  return {
    name: tag.name,
    color: tag.color ?? COLOR_PALETTE[0].value,
  }
}

function formToPayload(form: TagFormData) {
  return {
    name: form.name,
    color: form.color || null,
  }
}

/* ─── Color Picker ─── */

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          aria-label={color.label}
          className={`h-8 w-8 rounded-full transition-transform ${
            value === color.value
              ? 'ring-2 ring-ring ring-offset-2 scale-110'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color.value }}
        />
      ))}
    </div>
  )
}

/* ─── Tag Form ─── */

function TagForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: TagFormData
  onSubmit: (data: TagFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [form, setForm] = useState<TagFormData>(initialData)

  function handleChange(field: keyof TagFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  const inputClass =
    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tag-name" className="mb-1.5 block text-sm font-medium">
          名前
        </label>
        <input
          id="tag-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">カラー</label>
        <ColorPicker
          value={form.color}
          onChange={(color) => handleChange('color', color)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

/* ─── Tag Card ─── */

function TagCard({
  tag,
  isEditing,
  isDeleting,
  onEdit,
  onDelete,
  onCancelEdit,
  onCancelDelete,
  onSubmitEdit,
  onConfirmDelete,
  isSubmitting,
  isDeletingPending,
}: {
  tag: Tag
  isEditing: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
  onCancelEdit: () => void
  onCancelDelete: () => void
  onSubmitEdit: (data: TagFormData) => void
  onConfirmDelete: () => void
  isSubmitting: boolean
  isDeletingPending: boolean
}) {
  if (isEditing) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">タグを編集</h3>
        <TagForm
          initialData={tagToForm(tag)}
          onSubmit={onSubmitEdit}
          onCancel={onCancelEdit}
          isSubmitting={isSubmitting}
        />
      </div>
    )
  }

  if (isDeleting) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm">
        <p className="text-sm">
          <strong>{tag.name}</strong> を削除しますか？問題集や問題との関連付けも解除されます。
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onConfirmDelete}
            disabled={isDeletingPending}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeletingPending ? '削除中...' : '削除する'}
          </button>
          <button
            onClick={onCancelDelete}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-2xl border bg-card shadow-sm transition-colors hover:bg-muted/30">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: tag.color ?? '#64748B' }}
          />
          <span className="text-base font-bold">{tag.name}</span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`${tag.name}を編集`}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`${tag.name}を削除`}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Loading ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-5">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <div className="h-5 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ─── */

export default function AdminTagsPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => api.get<ApiResponse<Tag[]>>('/tags'),
  })

  const createMutation = useMutation({
    mutationFn: (data: TagFormData) =>
      api.post<ApiResponse<Tag>>('/tags', formToPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      setShowCreateForm(false)
      setMutationError(null)
    },
    onError: (error: Error) => setMutationError(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagFormData }) =>
      api.put<ApiResponse<Tag>>(`/tags/${id}`, formToPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      setEditingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => setMutationError(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<null>>(`/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      setDeletingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => setMutationError(error.message),
  })

  if (tagsQuery.isLoading) return <LoadingSkeleton />
  if (tagsQuery.error) return <ErrorMessage message={tagsQuery.error.message} />

  const tags = tagsQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">タグ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            問題集や問題の分類タグを管理します。
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => { setShowCreateForm(true); setMutationError(null) }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            追加
          </button>
        )}
      </div>

      {mutationError && <ErrorMessage message={mutationError} />}

      {showCreateForm && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">新規タグ</h2>
          <TagForm
            initialData={EMPTY_FORM}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => { setShowCreateForm(false); setMutationError(null) }}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {tags.length === 0 && !showCreateForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <path d="M7 7h.01" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">タグがまだありません</p>
          <p className="mt-1 text-xs text-muted-foreground/70">最初のタグを作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              isEditing={editingId === tag.id}
              isDeleting={deletingId === tag.id}
              onEdit={() => { setEditingId(tag.id); setDeletingId(null); setMutationError(null) }}
              onDelete={() => { setDeletingId(tag.id); setEditingId(null); setMutationError(null) }}
              onCancelEdit={() => { setEditingId(null); setMutationError(null) }}
              onCancelDelete={() => { setDeletingId(null); setMutationError(null) }}
              onSubmitEdit={(data) => updateMutation.mutate({ id: tag.id, data })}
              onConfirmDelete={() => deleteMutation.mutate(tag.id)}
              isSubmitting={updateMutation.isPending}
              isDeletingPending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
