import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatDateShort } from '@/lib/format'
import { ErrorMessage } from '@/components/shared/error-message'
import {
  ResponsiveTable,
  type ColumnDef,
} from '@/components/shared/responsive-table'
import type { ApiResponse, QuestionSet, Category } from '@/types'

function DeleteConfirmation({
  title,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
      <p className="text-sm">
        <strong>{title}</strong> を削除してもよろしいですか？この操作は元に戻せません。
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg border bg-muted/50" />
      ))}
    </div>
  )
}

export default function AdminQuestionSetsPage() {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const setsQuery = useQuery({
    queryKey: queryKeys.questionSets.all,
    queryFn: () =>
      api.get<ApiResponse<QuestionSet[]>>('/question-sets'),
  })

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete<ApiResponse<null>>(`/question-sets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionSets.all })
      setDeletingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => {
      setMutationError(error.message)
    },
  })

  if (setsQuery.isLoading || categoriesQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (setsQuery.error) {
    return <ErrorMessage message={setsQuery.error.message} />
  }

  const questionSets = setsQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []

  const categoryMap = new Map(
    categories.map((c) => [c.id, c.name]),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">問題セット</h1>
          <p className="mt-1 text-muted-foreground">
            試験用の問題セットを管理します。
          </p>
        </div>
        <Link
          to="/admin/question-sets/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          新規作成
        </Link>
      </div>

      {mutationError && <ErrorMessage message={mutationError} />}

      <ResponsiveTable
        data={questionSets}
        columns={[
          {
            header: 'タイトル',
            key: 'title',
            cell: (set: QuestionSet) => (
              <Link
                to={`/admin/question-sets/${set.id}`}
                className="font-medium text-primary hover:underline"
              >
                {set.title}
              </Link>
            ),
            primary: true,
          },
          {
            header: 'カテゴリ',
            key: 'category',
            cell: (set: QuestionSet) => (
              <span className="text-muted-foreground">
                {categoryMap.get(set.categoryId) ?? '不明'}
              </span>
            ),
          },
          {
            header: '問題数',
            key: 'questionCount',
            cell: (set: QuestionSet) =>
              set.questionCount ?? set.questions?.length ?? 0,
          },
          {
            header: 'ステータス',
            key: 'status',
            cell: (set: QuestionSet) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  set.isPublished
                    ? 'bg-success-muted text-success-foreground'
                    : 'bg-warning-muted text-flag-foreground'
                }`}
              >
                {set.isPublished ? '公開' : '下書き'}
              </span>
            ),
          },
          {
            header: '作成日',
            key: 'createdAt',
            cell: (set: QuestionSet) => (
              <span className="text-muted-foreground">
                {formatDateShort(set.createdAt)}
              </span>
            ),
          },
          {
            header: '操作',
            key: 'actions',
            align: 'right' as const,
            hideOnMobile: true,
            cell: (set: QuestionSet) =>
              deletingId === set.id ? (
                <DeleteConfirmation
                  title={set.title}
                  onConfirm={() => deleteMutation.mutate(set.id)}
                  onCancel={() => {
                    setDeletingId(null)
                    setMutationError(null)
                  }}
                  isDeleting={deleteMutation.isPending}
                />
              ) : (
                <div className="flex justify-end gap-2">
                  <Link
                    to={`/admin/question-sets/${set.id}`}
                    className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(set.id)
                      setMutationError(null)
                    }}
                    className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    削除
                  </button>
                </div>
              ),
          },
        ] satisfies ColumnDef<QuestionSet>[]}
        keyExtractor={(set) => set.id}
        cardFooter={(set) =>
          deletingId === set.id ? (
            <DeleteConfirmation
              title={set.title}
              onConfirm={() => deleteMutation.mutate(set.id)}
              onCancel={() => {
                setDeletingId(null)
                setMutationError(null)
              }}
              isDeleting={deleteMutation.isPending}
            />
          ) : (
            <div className="flex gap-2">
              <Link
                to={`/admin/question-sets/${set.id}`}
                className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                編集
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDeletingId(set.id)
                  setMutationError(null)
                }}
                className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                削除
              </button>
            </div>
          )
        }
        emptyMessage="問題セットがまだありません。最初の問題セットを作成してください。"
      />
    </div>
  )
}
