import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import { StaggerChildren } from '@/components/shared/stagger-children'
import type { ApiResponse, Subject, Workbook } from '@/types'

function SubjectHeader({ subject }: { subject: Subject }) {
  return (
    <div>
      <Link
        to="/dashboard"
        className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        ダッシュボードに戻る
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
      {subject.description && (
        <p className="mt-1 text-muted-foreground">{subject.description}</p>
      )}
    </div>
  )
}

function WorkbookCard({ workbook }: { workbook: Workbook }) {
  const questionCount = workbook.questionCount ?? workbook.questions?.length

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm motion-safe:hover:-translate-y-0.5 motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:shadow-md">
      <div className="mb-4">
        <h3 className="font-semibold">{workbook.title}</h3>
        {workbook.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {workbook.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {questionCount !== undefined && (
            <span className="inline-flex items-center gap-1">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5" />
                <path d="M15 11h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5" />
                <path d="M5 11V7a3 3 0 0 1 6 0v4" />
                <path d="M13 11V7a3 3 0 0 1 6 0v4" />
              </svg>
              {questionCount}問
            </span>
          )}
          {workbook.timeLimit !== null && (
            <span className="inline-flex items-center gap-1">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {Math.floor(workbook.timeLimit / 60)}分
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to={`/workbooks/${workbook.id}/history`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          履歴
        </Link>
        <span className="flex-1" />
        <Link
          to={`/practice/${workbook.id}`}
          state={{ title: workbook.title, questionCount, timeLimit: workbook.timeLimit }}
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          演習
        </Link>
        <Link
          to={`/exam/${workbook.id}`}
          state={{ title: workbook.title, questionCount, timeLimit: workbook.timeLimit }}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          実戦
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-3 text-muted-foreground/50"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p className="text-sm text-muted-foreground">
        この科目にはまだ公開された問題集がありません。
      </p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-32 rounded bg-muted/50" />
        <div className="h-8 w-64 rounded bg-muted/50" />
        <div className="h-4 w-96 rounded bg-muted/50" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  )
}

export default function SubjectExams() {
  const { subjectId } = useParams<{ subjectId: string }>()

  const subjectQuery = useQuery({
    queryKey: queryKeys.subjects.detail(subjectId!),
    queryFn: () => api.get<ApiResponse<Subject>>(`/subjects/${subjectId}`),
    enabled: !!subjectId,
  })

  const workbooksQuery = useQuery({
    queryKey: queryKeys.workbooks.list({
      subjectId: subjectId!,
      published: 'true',
    }),
    queryFn: () =>
      api.get<ApiResponse<Workbook[]>>('/workbooks', {
        subjectId: subjectId!,
        published: 'true',
      }),
    enabled: !!subjectId,
  })

  const isLoading = subjectQuery.isLoading || workbooksQuery.isLoading
  const error = subjectQuery.error || workbooksQuery.error

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  const subject = subjectQuery.data?.data
  const workbooks = workbooksQuery.data?.data ?? []

  if (!subject) {
    return <ErrorMessage message="科目が見つかりません。" />
  }

  return (
    <div className="space-y-6">
      <SubjectHeader subject={subject} />

      {workbooks.length === 0 ? (
        <EmptyState />
      ) : (
        <StaggerChildren staggerMs={60} className="grid gap-4 sm:grid-cols-2">
          {workbooks.map((wb) => (
            <WorkbookCard key={wb.id} workbook={wb} />
          ))}
        </StaggerChildren>
      )}
    </div>
  )
}
