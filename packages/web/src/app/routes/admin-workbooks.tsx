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
import type { ApiResponse, Workbook, Subject } from '@/types'

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

export default function AdminWorkbooksPage() {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const workbooksQuery = useQuery({
    queryKey: queryKeys.workbooks.all,
    queryFn: () =>
      api.get<ApiResponse<Workbook[]>>('/workbooks'),
  })

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => api.get<ApiResponse<Subject[]>>('/subjects'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete<ApiResponse<null>>(`/workbooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbooks.all })
      setDeletingId(null)
      setMutationError(null)
    },
    onError: (error: Error) => {
      setMutationError(error.message)
    },
  })

  if (workbooksQuery.isLoading || subjectsQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (workbooksQuery.error) {
    return <ErrorMessage message={workbooksQuery.error.message} />
  }

  const workbooks = workbooksQuery.data?.data ?? []
  const subjects = subjectsQuery.data?.data ?? []

  const subjectMap = new Map(
    subjects.map((s) => [s.id, s.name]),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">問題集</h1>
          <p className="mt-1 text-muted-foreground">
            試験用の問題集を管理します。
          </p>
        </div>
        <Link
          to="/admin/workbooks/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          新規作成
        </Link>
      </div>

      {mutationError && <ErrorMessage message={mutationError} />}

      <ResponsiveTable
        data={workbooks}
        columns={[
          {
            header: 'タイトル',
            key: 'title',
            cell: (wb: Workbook) => (
              <Link
                to={`/admin/workbooks/${wb.id}`}
                className="font-medium text-primary hover:underline"
              >
                {wb.title}
              </Link>
            ),
            primary: true,
          },
          {
            header: '科目',
            key: 'subject',
            cell: (wb: Workbook) => (
              <span className="text-muted-foreground">
                {subjectMap.get(wb.subjectId) ?? '不明'}
              </span>
            ),
          },
          {
            header: '問題数',
            key: 'questionCount',
            cell: (wb: Workbook) =>
              wb.questionCount ?? wb.questions?.length ?? 0,
          },
          {
            header: 'ステータス',
            key: 'status',
            cell: (wb: Workbook) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  wb.isPublished
                    ? 'bg-success-muted text-success-foreground'
                    : 'bg-warning-muted text-flag-foreground'
                }`}
              >
                {wb.isPublished ? '公開' : '下書き'}
              </span>
            ),
          },
          {
            header: '作成日',
            key: 'createdAt',
            cell: (wb: Workbook) => (
              <span className="text-muted-foreground">
                {formatDateShort(wb.createdAt)}
              </span>
            ),
          },
          {
            header: '操作',
            key: 'actions',
            align: 'right' as const,
            hideOnMobile: true,
            cell: (wb: Workbook) =>
              deletingId === wb.id ? (
                <DeleteConfirmation
                  title={wb.title}
                  onConfirm={() => deleteMutation.mutate(wb.id)}
                  onCancel={() => {
                    setDeletingId(null)
                    setMutationError(null)
                  }}
                  isDeleting={deleteMutation.isPending}
                />
              ) : (
                <div className="flex justify-end gap-2">
                  <Link
                    to={`/admin/workbooks/${wb.id}`}
                    className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(wb.id)
                      setMutationError(null)
                    }}
                    className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    削除
                  </button>
                </div>
              ),
          },
        ] satisfies ColumnDef<Workbook>[]}
        keyExtractor={(wb) => wb.id}
        cardFooter={(wb) =>
          deletingId === wb.id ? (
            <DeleteConfirmation
              title={wb.title}
              onConfirm={() => deleteMutation.mutate(wb.id)}
              onCancel={() => {
                setDeletingId(null)
                setMutationError(null)
              }}
              isDeleting={deleteMutation.isPending}
            />
          ) : (
            <div className="flex gap-2">
              <Link
                to={`/admin/workbooks/${wb.id}`}
                className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                編集
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDeletingId(wb.id)
                  setMutationError(null)
                }}
                className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                削除
              </button>
            </div>
          )
        }
        emptyMessage="問題集がまだありません。最初の問題集を作成してください。"
      />
    </div>
  )
}
