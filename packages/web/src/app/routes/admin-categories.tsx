import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import type { ApiResponse, Category } from '@/types'

interface CategoryFormData {
  name: string
  slug: string
  description: string
  passScore: string
  sortOrder: string
}

const EMPTY_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  passScore: '',
  sortOrder: '0',
}

function categoryToForm(category: Category): CategoryFormData {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    passScore: category.passScore !== null ? String(category.passScore) : '',
    sortOrder: String(category.sortOrder),
  }
}

function formToPayload(form: CategoryFormData) {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description || null,
    passScore: form.passScore ? Number(form.passScore) : null,
    sortOrder: Number(form.sortOrder) || 0,
  }
}

function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: CategoryFormData
  onSubmit: (data: CategoryFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [form, setForm] = useState<CategoryFormData>(initialData)

  function handleChange(
    field: keyof CategoryFormData,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category-name"
            className="mb-1 block text-sm font-medium"
          >
            名前
          </label>
          <input
            id="category-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="category-slug"
            className="mb-1 block text-sm font-medium"
          >
            Slug
          </label>
          <input
            id="category-slug"
            type="text"
            required
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="category-description"
          className="mb-1 block text-sm font-medium"
        >
          説明
        </label>
        <textarea
          id="category-description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category-pass-score"
            className="mb-1 block text-sm font-medium"
          >
            合格基準 (%)
          </label>
          <input
            id="category-pass-score"
            type="number"
            min="0"
            max="100"
            value={form.passScore}
            onChange={(e) => handleChange('passScore', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="category-sort-order"
            className="mb-1 block text-sm font-medium"
          >
            表示順
          </label>
          <input
            id="category-sort-order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

function DeleteConfirmation({
  categoryName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  categoryName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
      <p className="text-sm">
        <strong>{categoryName}</strong> を削除してもよろしいですか？この操作は元に戻せません。
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
        >
          {isDeleting ? '削除中...' : '削除'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-muted/50" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg border bg-muted/50" />
      ))}
    </div>
  )
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories'),
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      api.post<ApiResponse<Category>>('/categories', formToPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      setShowCreateForm(false)
      setMutationError(null)
    },
    onError: (error: Error) => {
      setMutationError(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      api.put<ApiResponse<Category>>(
        `/categories/${id}`,
        formToPayload(data),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      setEditingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => {
      setMutationError(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete<ApiResponse<null>>(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      setDeletingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => {
      setMutationError(error.message)
    },
  })

  if (categoriesQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (categoriesQuery.error) {
    return <ErrorMessage message={categoriesQuery.error.message} />
  }

  const categories = categoriesQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">カテゴリ</h1>
          <p className="mt-1 text-muted-foreground">
            試験カテゴリを管理します。
          </p>
        </div>
        {!showCreateForm && (
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true)
              setMutationError(null)
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            カテゴリを追加
          </button>
        )}
      </div>

      {mutationError && <ErrorMessage message={mutationError} />}

      {showCreateForm && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">新規カテゴリ</h2>
          <CategoryForm
            initialData={EMPTY_FORM}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => {
              setShowCreateForm(false)
              setMutationError(null)
            }}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {categories.length === 0 && !showCreateForm ? (
        <p className="text-sm text-muted-foreground">
          カテゴリがまだありません。最初のカテゴリを作成してください。
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border bg-card p-4"
            >
              {editingId === category.id ? (
                <CategoryForm
                  initialData={categoryToForm(category)}
                  onSubmit={(data) =>
                    updateMutation.mutate({ id: category.id, data })
                  }
                  onCancel={() => {
                    setEditingId(null)
                    setMutationError(null)
                  }}
                  isSubmitting={updateMutation.isPending}
                />
              ) : deletingId === category.id ? (
                <DeleteConfirmation
                  categoryName={category.name}
                  onConfirm={() => deleteMutation.mutate(category.id)}
                  onCancel={() => {
                    setDeletingId(null)
                    setMutationError(null)
                  }}
                  isDeleting={deleteMutation.isPending}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Slug: {category.slug}
                      {category.passScore !== null &&
                        ` | 合格基準: ${category.passScore}%`}
                      {` | 表示順: ${category.sortOrder}`}
                    </p>
                    {category.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(category.id)
                        setDeletingId(null)
                        setMutationError(null)
                      }}
                      className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingId(category.id)
                        setEditingId(null)
                        setMutationError(null)
                      }}
                      className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
