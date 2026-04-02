import { createBrowserRouter, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthGuard } from '@/components/layout/auth-guard'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

const SignInPage = lazy(() => import('@/app/routes/sign-in'))
const SignUpPage = lazy(() => import('@/app/routes/sign-up'))
const Dashboard = lazy(() => import('@/app/routes/dashboard'))
const SubjectExams = lazy(() => import('@/app/routes/subject-exams'))
const Practice = lazy(() => import('@/app/routes/practice'))
const Exam = lazy(() => import('@/app/routes/exam'))
const ExamResult = lazy(() => import('@/app/routes/exam-result'))
const Stats = lazy(() => import('@/app/routes/stats'))
const HistoryDetail = lazy(() => import('@/app/routes/history-detail'))
const AdminSubjects = lazy(() => import('@/app/routes/admin-subjects'))
const AdminWorkbooks = lazy(() => import('@/app/routes/admin-workbooks'))
const AdminWorkbookEdit = lazy(
  () => import('@/app/routes/admin-workbook-edit'),
)
const AdminTags = lazy(() => import('@/app/routes/admin-tags'))
const AdminImportExport = lazy(
  () => import('@/app/routes/admin-import-export'),
)
const WorkbookHistory = lazy(
  () => import('@/app/routes/workbook-history'),
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
        path: 'exams/:subjectId',
        element: (
          <SuspenseWrapper>
            <SubjectExams />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'practice/:workbookId',
        element: (
          <SuspenseWrapper>
            <Practice />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'exam/:workbookId',
        element: (
          <SuspenseWrapper>
            <Exam />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'exam/:workbookId/result',
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
        path: 'workbooks/:workbookId/history',
        element: (
          <SuspenseWrapper>
            <WorkbookHistory />
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
        path: 'admin/subjects',
        element: (
          <SuspenseWrapper>
            <AdminSubjects />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/workbooks',
        element: (
          <SuspenseWrapper>
            <AdminWorkbooks />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/workbooks/:id',
        element: (
          <SuspenseWrapper>
            <AdminWorkbookEdit />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/tags',
        element: (
          <SuspenseWrapper>
            <AdminTags />
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
