import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { lazy, memo, Suspense, useMemo } from 'react'
import type { Components } from 'react-markdown'
import { parseMermaidBlocks } from '@/lib/mermaid'

const MermaidDiagram = lazy(() => import('./mermaid-diagram'))

function MermaidFallback() {
  return (
    <div className="flex h-32 items-center justify-center rounded border bg-muted">
      図を読み込み中...
    </div>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && 'props' in node) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>
    return extractText(el.props.children)
  }
  return ''
}

const MERMAID_KEYWORDS = /^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie|mindmap|timeline|gitGraph|journey|stateDiagram|quadrantChart|xychart|block-beta)\b/

function extractMermaidCode(raw: string): string {
  const lines = raw.trim().split('\n')
  if (lines.length === 0 || !MERMAID_KEYWORDS.test(lines[0].trim())) {
    return raw.trim()
  }

  const mermaidLines: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      mermaidLines.length > 0 &&
      trimmed.length > 0 &&
      !trimmed.startsWith('%%') &&
      !/^(subgraph|end|style|linkStyle|classDef|class|click|callback|note|participant|actor|loop|alt|else|opt|par|critical|break|rect|activate|deactivate|title|section)\b/.test(trimmed) &&
      !/^[A-Za-z0-9_]/.test(trimmed) &&
      !/^\s/.test(line)
    ) {
      break
    }
    mermaidLines.push(line)
  }

  return mermaidLines.join('\n').trim()
}

const markdownComponents: Components = {
  pre: ({ children, ...props }) => {
    if (children && typeof children === 'object' && 'props' in children) {
      const child = children as React.ReactElement<{
        className?: string
        children?: React.ReactNode
      }>
      const className = child.props?.className || ''

      if (/language-mermaid/.test(className)) {
        const raw = extractText(child.props?.children)
        const chart = extractMermaidCode(raw)
        return (
          <Suspense fallback={<MermaidFallback />}>
            <MermaidDiagram code={chart} />
          </Suspense>
        )
      }
    }

    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-foreground" {...props}>
        {children}
      </pre>
    )
  },
  code: ({ className, children, ...props }) => {
    const isBlock = /language-\w+/.test(className || '')
    if (isBlock) {
      return (
        <code className={`${className || ''} text-foreground`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground" {...props}>
        {children}
      </code>
    )
  },
}

const remarkPlugins = [remarkGfm]

const MarkdownBlock = memo(function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  )
})

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => parseMermaidBlocks(content), [content])
  const hasMermaidBlocks = blocks.some((b) => b.type === 'mermaid')

  if (!hasMermaidBlocks) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MarkdownBlock content={content} />
      </div>
    )
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {blocks.map((block, i) =>
        block.type === 'mermaid' ? (
          <Suspense key={i} fallback={<MermaidFallback />}>
            <MermaidDiagram code={block.content} />
          </Suspense>
        ) : block.content.trim() ? (
          <MarkdownBlock key={i} content={block.content} />
        ) : null,
      )}
    </div>
  )
})
