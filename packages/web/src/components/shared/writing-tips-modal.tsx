import { lazy, useState, Suspense, type RefObject } from 'react'
import { Modal } from '@/components/shared/modal'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { cn } from '@/lib/utils'

const MermaidDiagram = lazy(() => import('@/components/shared/mermaid-diagram'))

interface WritingTipsModalProps {
  isOpen: boolean
  onClose: () => void
  modalRef: RefObject<HTMLDivElement | null>
}

const tabs = [
  { id: 'markdown', label: 'Markdown記法' },
  { id: 'mermaid', label: 'Mermaid図' },
] as const

type TabId = (typeof tabs)[number]['id']

const markdownContent = `
## 基本書式

| 書式 | 入力 | 結果 |
|------|------|------|
| 太字 | \`**太字**\` | **太字** |
| 斜体 | \`*斜体*\` | *斜体* |
| 打消線 | \`~~打消線~~\` | ~~打消線~~ |
| インラインコード | \`` + '`' + `コード` + '`' + `\` | \`コード\` |

## 見出し

入力:
\`\`\`
## 見出し2
### 見出し3
\`\`\`

表示結果:

## 見出し2
### 見出し3

---

## リスト

入力:
\`\`\`
- 項目A
- 項目B
  - ネストした項目

1. 番号付き
2. リスト
\`\`\`

表示結果:

- 項目A
- 項目B
  - ネストした項目

1. 番号付き
2. リスト

---

## テーブル (GFM)

入力:
\`\`\`
| 列A | 列B | 列C |
|-----|-----|-----|
| 1   | 2   | 3   |
\`\`\`

表示結果:

| 列A | 列B | 列C |
|-----|-----|-----|
| 1   | 2   | 3   |

---

## コードブロック

言語名を指定してシンタックスハイライト:

\`\`\`\`
\`\`\`javascript
function hello() {
  return "world"
}
\`\`\`
\`\`\`\`

表示結果:

\`\`\`javascript
function hello() {
  return "world"
}
\`\`\`
`

const mermaidExamples = [
  {
    title: '書き方',
    description: '問題文の中で ` ```mermaid ` で始まるコードブロックを書くと図に変換される。',
    code: `\`\`\`mermaid
graph TD
    A[開始] --> B{条件}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
\`\`\``,
    mermaid: `graph TD
    A[開始] --> B{条件}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]`,
  },
  {
    title: 'シーケンス図',
    code: `\`\`\`mermaid
sequenceDiagram
    Client->>Server: リクエスト
    Server->>DB: クエリ
    DB-->>Server: 結果
    Server-->>Client: レスポンス
\`\`\``,
    mermaid: `sequenceDiagram
    Client->>Server: リクエスト
    Server->>DB: クエリ
    DB-->>Server: 結果
    Server-->>Client: レスポンス`,
  },
  {
    title: 'ER図',
    code: `\`\`\`mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ITEM : contains
\`\`\``,
    mermaid: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ITEM : contains`,
  },
  {
    title: '円グラフ',
    code: `\`\`\`mermaid
pie title 回答分布
    "正解" : 65
    "不正解" : 35
\`\`\``,
    mermaid: `pie title 回答分布
    "正解" : 65
    "不正解" : 35`,
  },
]

const mermaidIntro = `## 対応図タイプ

フローチャート、シーケンス図、ER図、クラス図、ガントチャート、円グラフ、マインドマップ、タイムライン、状態遷移図など。`

const tabContent: Record<Exclude<TabId, 'mermaid'>, string> = {
  markdown: markdownContent,
}

function MermaidTabContent() {
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={mermaidIntro} />

      {mermaidExamples.map((example) => (
        <div key={example.title} className="space-y-3">
          <h3 className="text-base font-bold">{example.title}</h3>
          {example.description && (
            <p className="text-sm text-muted-foreground">{example.description}</p>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">入力:</p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-foreground">
              <code className="text-sm text-foreground">{example.code}</code>
            </pre>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">表示結果:</p>
            <Suspense
              fallback={
                <div className="flex h-24 items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
                  図を読み込み中...
                </div>
              }
            >
              <MermaidDiagram code={example.mermaid} />
            </Suspense>
          </div>
        </div>
      ))}
    </div>
  )
}

export function WritingTipsModal({ isOpen, onClose, modalRef }: WritingTipsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('markdown')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="記入Tips" modalRef={modalRef}>
      <div className="-mx-5 border-b px-5">
        <nav className="flex gap-1 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4" role="tabpanel">
        {activeTab === 'mermaid' ? (
          <MermaidTabContent />
        ) : (
          <MarkdownRenderer content={tabContent[activeTab]} />
        )}
      </div>
    </Modal>
  )
}
