import { useState, useEffect, useRef, memo } from 'react'
import { getMermaidImageUrl } from '@/lib/mermaid'
import { useTheme } from '@/components/shared/theme-provider'

export default memo(function MermaidDiagram({ code }: { code: string }) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  const mermaidTheme = theme === 'dark' ? 'dark' : 'default'
  const imageUrl = getMermaidImageUrl(code, mermaidTheme)

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl
    if (img.complete) {
      setIsLoading(false)
      setHasError(false)
    } else {
      setIsLoading(true)
      setHasError(false)
    }
  }, [imageUrl, retryKey])

  if (hasError) {
    return (
      <div className="my-2 rounded border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">図の読み込みに失敗しました</p>
        <button
          onClick={() => {
            setRetryKey((prev) => prev + 1)
            setHasError(false)
            setIsLoading(true)
          }}
          className="mt-2 rounded border px-3 py-1 text-sm hover:bg-muted"
        >
          再読み込み
        </button>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Mermaidコードを表示
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
            {code}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className="my-2">
      {isLoading && (
        <div className="flex h-32 items-center justify-center rounded border bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <img
        key={retryKey}
        ref={imgRef}
        src={imageUrl}
        alt="Mermaid diagram"
        className={isLoading ? 'hidden' : 'max-w-full rounded'}
        onLoad={() => {
          setIsLoading(false)
          setHasError(false)
        }}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
})
