import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import { StaggerChildren } from '@/components/shared/stagger-children'
import type { ApiResponse, Category, QuestionSet } from '@/types'

function CategoryHeader({ category }: { category: Category }) {
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
      <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="mt-1 text-muted-foreground">{category.description}</p>
      )}
    </div>
  )
}

function QuestionSetCard({ questionSet }: { questionSet: QuestionSet }) {
  const questionCount = questionSet.questionCount ?? questionSet.questions?.length

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm motion-safe:hover:-translate-y-0.5 motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:shadow-md">
      <div className="mb-4">
        <h3 className="font-semibold">{questionSet.title}</h3>
        {questionSet.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {questionSet.description}
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
          {questionSet.timeLimit !== null && (
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
              {Math.floor(questionSet.timeLimit / 60)}分
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to={`/question-sets/${questionSet.id}/history`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          履歴
        </Link>
        <span className="flex-1" />
        <Link
          to={`/practice/${questionSet.id}`}
          state={{ title: questionSet.title, questionCount, timeLimit: questionSet.timeLimit }}
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          演習
        </Link>
        <Link
          to={`/exam/${questionSet.id}`}
          state={{ title: questionSet.title, questionCount, timeLimit: questionSet.timeLimit }}
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
        このカテゴリにはまだ公開された問題セットがありません。
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

export default function CategoryExams() {
  const { categoryId } = useParams<{ categoryId: string }>()

  const categoryQuery = useQuery({
    queryKey: queryKeys.categories.detail(categoryId!),
    queryFn: () => api.get<ApiResponse<Category>>(`/categories/${categoryId}`),
    enabled: !!categoryId,
  })

  const questionSetsQuery = useQuery({
    queryKey: queryKeys.questionSets.list({
      categoryId: categoryId!,
      published: 'true',
    }),
    queryFn: () =>
      api.get<ApiResponse<QuestionSet[]>>('/question-sets', {
        categoryId: categoryId!,
        published: 'true',
      }),
    enabled: !!categoryId,
  })

  const isLoading = categoryQuery.isLoading || questionSetsQuery.isLoading
  const error = categoryQuery.error || questionSetsQuery.error

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  const category = categoryQuery.data?.data
  const questionSets = questionSetsQuery.data?.data ?? []

  if (!category) {
    return <ErrorMessage message="カテゴリが見つかりません。" />
  }

  return (
    <div className="space-y-6">
      <CategoryHeader category={category} />

      {questionSets.length === 0 ? (
        <EmptyState />
      ) : (
        <StaggerChildren staggerMs={60} className="grid gap-4 sm:grid-cols-2">
          {questionSets.map((qs) => (
            <QuestionSetCard key={qs.id} questionSet={qs} />
          ))}
        </StaggerChildren>
      )}
    </div>
  )
}
