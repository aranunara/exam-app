import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import type { ApiResponse, Subject, Workbook } from '@/types'

/* ─── Form types ─── */

interface SubjectFormData {
  name: string
  description: string
  passScore: string
  sortOrder: string
}

const EMPTY_FORM: SubjectFormData = {
  name: '',
  description: '',
  passScore: '',
  sortOrder: '0',
}

function subjectToForm(subject: Subject): SubjectFormData {
  return {
    name: subject.name,
    description: subject.description ?? '',
    passScore: subject.passScore !== null ? String(subject.passScore) : '',
    sortOrder: String(subject.sortOrder),
  }
}

function formToPayload(form: SubjectFormData) {
  return {
    name: form.name,
    description: form.description || null,
    passScore: form.passScore ? Number(form.passScore) : null,
    sortOrder: Number(form.sortOrder) || 0,
  }
}

/* ─── Subject Form ─── */

function SubjectForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: SubjectFormData
  onSubmit: (data: SubjectFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [form, setForm] = useState<SubjectFormData>(initialData)

  function handleChange(field: keyof SubjectFormData, value: string) {
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
        <label htmlFor="subject-name" className="mb-1.5 block text-sm font-medium">
          名前
        </label>
        <input
          id="subject-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="subject-description" className="mb-1.5 block text-sm font-medium">
          説明
        </label>
        <textarea
          id="subject-description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="subject-pass-score" className="mb-1.5 block text-sm font-medium">
            合格基準 (%)
          </label>
          <input
            id="subject-pass-score"
            type="number"
            min="0"
            max="100"
            value={form.passScore}
            onChange={(e) => handleChange('passScore', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="subject-sort-order" className="mb-1.5 block text-sm font-medium">
            表示順
          </label>
          <input
            id="subject-sort-order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className={inputClass}
          />
        </div>
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

/* ─── Subject Card ─── */

function SubjectCard({
  subject,
  workbookCount,
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
  subject: Subject
  workbookCount: number
  isEditing: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
  onCancelEdit: () => void
  onCancelDelete: () => void
  onSubmitEdit: (data: SubjectFormData) => void
  onConfirmDelete: () => void
  isSubmitting: boolean
  isDeletingPending: boolean
}) {
  if (isEditing) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">科目を編集</h3>
        <SubjectForm
          initialData={subjectToForm(subject)}
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
          <strong>{subject.name}</strong> を削除しますか？関連する問題集にも影響します。
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
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">{subject.name}</h3>
            {subject.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {subject.description}
              </p>
            )}
          </div>

          {/* Actions - top right */}
          <div className="flex shrink-0 gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="編集"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="削除"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {subject.passScore !== null && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              合格 {subject.passScore}%
            </span>
          )}
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {workbookCount}セット
          </span>
        </div>
      </div>

      {/* Footer: quick link to create workbook */}
      <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3 dark:bg-muted/10">
        <Link
          to={`/admin/workbooks?subject=${subject.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          問題集を見る
        </Link>
        <Link
          to={`/admin/workbooks/new?subjectId=${subject.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          問題集を作成
        </Link>
      </div>
    </div>
  )
}

/* ─── Loading ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-muted/40 p-5">
          <div className="h-5 w-1/3 rounded bg-muted" />
          <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-5 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ─── */

export default function AdminSubjectsPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => api.get<ApiResponse<Subject[]>>('/subjects'),
  })

  const setsQuery = useQuery({
    queryKey: queryKeys.workbooks.all,
    queryFn: () => api.get<ApiResponse<Workbook[]>>('/workbooks'),
  })

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) =>
      api.post<ApiResponse<Subject>>('/subjects', formToPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
      setShowCreateForm(false)
      setMutationError(null)
    },
    onError: (error: Error) => setMutationError(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) =>
      api.put<ApiResponse<Subject>>(`/subjects/${id}`, formToPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
      setEditingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => setMutationError(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<null>>(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.workbooks.all })
      setDeletingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => setMutationError(error.message),
  })

  if (subjectsQuery.isLoading) return <LoadingSkeleton />
  if (subjectsQuery.error) return <ErrorMessage message={subjectsQuery.error.message} />

  const subjects = subjectsQuery.data?.data ?? []
  const workbooks = setsQuery.data?.data ?? []

  const setCountMap = new Map<string, number>()
  for (const wb of workbooks) {
    setCountMap.set(wb.subjectId, (setCountMap.get(wb.subjectId) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">科目</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            問題集の分類を管理します。
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
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">新規科目</h2>
          <SubjectForm
            initialData={EMPTY_FORM}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => { setShowCreateForm(false); setMutationError(null) }}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {subjects.length === 0 && !showCreateForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">科目がまだありません</p>
          <p className="mt-1 text-xs text-muted-foreground/70">最初の科目を作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              workbookCount={setCountMap.get(subject.id) ?? 0}
              isEditing={editingId === subject.id}
              isDeleting={deletingId === subject.id}
              onEdit={() => { setEditingId(subject.id); setDeletingId(null); setMutationError(null) }}
              onDelete={() => { setDeletingId(subject.id); setEditingId(null); setMutationError(null) }}
              onCancelEdit={() => { setEditingId(null); setMutationError(null) }}
              onCancelDelete={() => { setDeletingId(null); setMutationError(null) }}
              onSubmitEdit={(data) => updateMutation.mutate({ id: subject.id, data })}
              onConfirmDelete={() => deleteMutation.mutate(subject.id)}
              isSubmitting={updateMutation.isPending}
              isDeletingPending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
