import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import type { ApiResponse, Workbook } from '@/types'

interface ImportPreview {
  title: string
  description: string | null
  questionCount: number
  raw: unknown
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-muted/50" />
      <div className="h-40 rounded-lg border bg-muted/50" />
      <div className="h-40 rounded-lg border bg-muted/50" />
    </div>
  )
}

function ExportSection({ workbooks }: { workbooks: Workbook[] }) {
  const [selectedId, setSelectedId] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleExport() {
    if (!selectedId) return

    setIsExporting(true)
    setExportError(null)

    try {
      const response = await api.get<ApiResponse<unknown>>(
        `/workbooks/${selectedId}/export`,
      )

      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const selectedSet = workbooks.find((s) => s.id === selectedId)
      const filename = selectedSet
        ? `${selectedSet.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`
        : 'export.json'

      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'エクスポートに失敗しました'
      setExportError(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">エクスポート</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        エクスポートする問題集を選択してください。
      </p>

      {exportError && (
        <div className="mb-4">
          <ErrorMessage message={exportError} />
        </div>
      )}

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label
            htmlFor="export-select"
            className="mb-1 block text-sm font-medium"
          >
            問題集
          </label>
          <select
            id="export-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">問題集を選択</option>
            {workbooks.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!selectedId || isExporting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isExporting ? 'エクスポート中...' : 'JSON エクスポート'}
        </button>
      </div>
    </div>
  )
}

function ImportSection() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const importMutation = useMutation({
    mutationFn: (data: unknown) =>
      api.post<ApiResponse<Workbook>>('/workbooks/import', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbooks.all })
      setPreview(null)
      setImportSuccess(true)
      setParseError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setTimeout(() => setImportSuccess(false), 5000)
    },
    onError: (error: Error) => {
      setParseError(error.message)
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setPreview(null)
      return
    }

    setParseError(null)
    setImportSuccess(false)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('無効な JSON 構造です')
        }

        const title =
          parsed.title ?? parsed.name ?? '無題'
        const description = parsed.description ?? null
        const questions = Array.isArray(parsed.questions)
          ? parsed.questions
          : []

        setPreview({
          title: String(title),
          description:
            description !== null ? String(description) : null,
          questionCount: questions.length,
          raw: parsed,
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'JSON の解析に失敗しました'
        setParseError(message)
        setPreview(null)
      }
    }
    reader.onerror = () => {
      setParseError('ファイルの読み込みに失敗しました')
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!preview) return
    importMutation.mutate(preview.raw)
  }

  function handleCancel() {
    setPreview(null)
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">インポート</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        JSON ファイルをアップロードして問題集をインポートします。
      </p>

      {parseError && (
        <div className="mb-4">
          <ErrorMessage message={parseError} />
        </div>
      )}

      {importSuccess && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success-muted p-4 text-sm text-success-foreground">
          問題集のインポートが完了しました。
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="import-file"
          className="mb-1 block text-sm font-medium"
        >
          JSON ファイル
        </label>
        <input
          id="import-file"
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-semibold">インポートプレビュー</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="font-medium text-muted-foreground">タイトル:</dt>
                <dd>{preview.title}</dd>
              </div>
              {preview.description && (
                <div className="flex gap-2">
                  <dt className="font-medium text-muted-foreground">
                    説明:
                  </dt>
                  <dd>{preview.description}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="font-medium text-muted-foreground">
                  問題数:
                </dt>
                <dd>{preview.questionCount}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {importMutation.isPending ? 'インポート中...' : 'インポートを実行'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminImportExportPage() {
  const setsQuery = useQuery({
    queryKey: queryKeys.workbooks.all,
    queryFn: () =>
      api.get<ApiResponse<Workbook[]>>('/workbooks'),
  })

  if (setsQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (setsQuery.error) {
    return <ErrorMessage message={setsQuery.error.message} />
  }

  const workbooks = setsQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          インポート / エクスポート
        </h1>
        <p className="mt-1 text-muted-foreground">
          問題集を JSON でエクスポート、またはファイルからインポートします。
        </p>
      </div>

      <ExportSection workbooks={workbooks} />
      <ImportSection />
    </div>
  )
}
