import { createBrowserRouter, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthGuard } from '@/components/layout/auth-guard'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

const SignInPage = lazy(() => import('@/app/routes/sign-in'))
const SignUpPage = lazy(() => import('@/app/routes/sign-up'))
const Dashboard = lazy(() => import('@/app/routes/dashboard'))
const CategoryExams = lazy(() => import('@/app/routes/category-exams'))
const Practice = lazy(() => import('@/app/routes/practice'))
const Exam = lazy(() => import('@/app/routes/exam'))
const ExamResult = lazy(() => import('@/app/routes/exam-result'))
const Stats = lazy(() => import('@/app/routes/stats'))
const HistoryDetail = lazy(() => import('@/app/routes/history-detail'))
const AdminCategories = lazy(() => import('@/app/routes/admin-categories'))
const AdminQuestionSets = lazy(() => import('@/app/routes/admin-question-sets'))
const AdminQuestionSetEdit = lazy(
  () => import('@/app/routes/admin-question-set-edit'),
)
const AdminImportExport = lazy(
  () => import('@/app/routes/admin-import-export'),
)

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    path: '/sign-in/*',
    element: (
      <SuspenseWrapper>
        <SignInPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/sign-up/*',
    element: (
      <SuspenseWrapper>
        <SignUpPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'exams/:categoryId',
        element: (
          <SuspenseWrapper>
            <CategoryExams />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'practice/:questionSetId',
        element: (
          <SuspenseWrapper>
            <Practice />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'exam/:questionSetId',
        element: (
          <SuspenseWrapper>
            <Exam />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'exam/:questionSetId/result',
        element: (
          <SuspenseWrapper>
            <ExamResult />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'stats',
        element: (
          <SuspenseWrapper>
            <Stats />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'stats/history/:attemptId',
        element: (
          <SuspenseWrapper>
            <HistoryDetail />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/categories',
        element: (
          <SuspenseWrapper>
            <AdminCategories />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/question-sets',
        element: (
          <SuspenseWrapper>
            <AdminQuestionSets />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/question-sets/:id',
        element: (
          <SuspenseWrapper>
            <AdminQuestionSetEdit />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/import-export',
        element: (
          <SuspenseWrapper>
            <AdminImportExport />
          </SuspenseWrapper>
        ),
      },
    ],
  },
])
