# Exam App

試験対策・学習用Webアプリケーション。問題セットの作成・管理、演習/実戦モードでの出題、詳細統計による弱点分析を提供する。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | [Vite 8](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Routing | [React Router v7](https://reactrouter.com/) (SPA mode) |
| State | [Zustand 5](https://zustand.docs.pmnd.rs/) + [TanStack Query v5](https://tanstack.com/query/) |
| Auth | [Clerk](https://clerk.com/) |
| Backend | [Hono](https://hono.dev/) (Cloudflare Workers) |
| DB | [Drizzle ORM](https://orm.drizzle.team/) + SQLite ([Cloudflare D1](https://developers.cloudflare.com/d1/)) |
| Validation | [Zod](https://zod.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) + [Mermaid](https://mermaid.js.org/) |

## 機能

### 出題モード

- **演習モード** — 1問ごとに即時フィードバック。問題・選択肢単位の解説（tips）を表示
- **実戦モード** — 全問完了後に一括採点。制限時間タイマー、問題フラグ（あとで見直す）対応

### 問題管理

- 試験区分（カテゴリ）マスタによる分類
- 問題セット・問題・選択肢のCRUD（管理画面）
- タグによる柔軟な分類（問題セット・問題の両レベル）
- JSON インポート/エクスポート
- Markdown + Mermaid 図表対応の解説（tips）

### 出題エンジン

- 問題順序・選択肢順序のランダムシャッフル（サーバー側 Fisher-Yates）
- 単一選択 / 複数選択の自動判定
- 正解は1つ以上〜選択肢数未満（バリデーション強制）
- 正解・解説はサーバー側で制御（回答前にクライアントに送信しない）

### 統計・分析

- 全体スコア推移
- カテゴリ別・タグ別成績
- 弱点分析（正答率下位の問題群）
- 過去の回答履歴 + ドリルダウン

### UX

- ダークモード
- キーボードショートカット（1-9: 選択肢, Enter: 提出, N/P: 前後, F: フラグ）
- モバイルレスポンシブ
- ルート単位のコード分割（lazy loading）

## プロジェクト構成

```
exam-app/
├── packages/
│   ├── server/              # Hono API (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── middleware/  # 認証, エラーハンドリング
│   │   │   │   ├── routes/      # API ルート定義
│   │   │   │   └── validators/  # Zod バリデーション
│   │   │   ├── db/
│   │   │   │   └── schema/      # Drizzle スキーマ
│   │   │   └── lib/             # ユーティリティ
│   │   ├── migrations/          # D1 マイグレーション
│   │   └── wrangler.jsonc       # Workers 設定
│   └── web/                 # React SPA (Vite)
│       └── src/
│           ├── app/
│           │   └── routes/      # ページコンポーネント
│           ├── features/        # 機能別モジュール
│           │   ├── dashboard/
│           │   ├── exam/
│           │   ├── practice/
│           │   ├── question/
│           │   ├── stats/
│           │   └── admin/
│           ├── components/
│           │   ├── ui/          # shadcn/ui
│           │   ├── layout/      # レイアウト
│           │   └── shared/      # 共通コンポーネント
│           ├── lib/             # API クライアント, Query Keys
│           └── types/           # 型定義
├── package.json
└── pnpm-workspace.yaml
```

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Clerk](https://clerk.com/) アカウント（API キー取得用）

### インストール

```bash
pnpm install
```

### 環境変数

```bash
# packages/server/.dev.vars
CLERK_SECRET_KEY=sk_test_xxxxx

# packages/web/.env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### DB セットアップ（ローカル）

```bash
cd packages/server
pnpm db:generate     # マイグレーションファイル生成
pnpm db:migrate:local # ローカル D1 にマイグレーション適用
pnpm db:seed         # シードデータ投入
```

### 開発サーバー起動

```bash
# ルートから両方同時に起動
pnpm dev
```

| サービス | URL |
|---------|-----|
| Web (Vite) | http://localhost:5173 |
| API (Wrangler) | http://localhost:8787 |

Vite の dev proxy が `/api` リクエストを `localhost:8787` に転送するため、CORS を意識せず開発できる。

## API

全エンドポイント: `/api/v1` プレフィックス、Clerk Bearer トークン認証

| リソース | エンドポイント | 概要 |
|---------|--------------|------|
| Categories | `GET/POST /categories`, `GET/PUT/DELETE /categories/:id` | 試験区分 CRUD |
| Tags | `GET/POST /tags`, `PUT/DELETE /tags/:id` | タグ CRUD |
| Question Sets | `GET/POST /question-sets`, `GET/PUT/DELETE /question-sets/:id` | 問題セット CRUD |
| Questions | `POST/PUT/DELETE /question-sets/:setId/questions/:id` | 問題 CRUD |
| Import/Export | `POST /question-sets/import`, `GET /question-sets/:id/export` | JSON 入出力 |
| Sessions | `POST /sessions`, `GET /:id/questions/:index`, `POST /:id/answers` | 出題エンジン |
| Stats | `GET /stats/overview\|categories\|tags\|history\|weak-areas` | 統計 |

## データモデル

```
categories 1 ──< N question_sets
question_sets N >──< N tags        (via question_set_tags)
question_sets 1 ──< N questions
questions     N >──< N tags        (via question_tags)
questions     1 ──< N choices

exam_sessions   N >── 1 question_sets
exam_sessions   1 ──< N session_answers
session_answers 1 ──< N session_answer_choices
```

## ビルド

```bash
pnpm build
```

## テスト

```bash
pnpm test
```

## デプロイ

### Cloudflare Pages + Workers + D1

#### 1. D1 データベース作成

```bash
npx wrangler d1 create exam-db
```

出力された `database_id` を `packages/server/wrangler.jsonc` に設定する。

#### 2. D1 マイグレーション（リモート）

```bash
cd packages/server
npx wrangler d1 migrations apply exam-db --remote
```

#### 3. Workers デプロイ（API）

```bash
cd packages/server
npx wrangler deploy
```

Clerk のシークレットキーを Workers のシークレットに設定:

```bash
npx wrangler secret put CLERK_SECRET_KEY
```

#### 4. Pages デプロイ（Web）

Cloudflare Pages に接続する方法:

**Option A: Git 連携（推奨）**

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
2. Git リポジトリを接続
3. ビルド設定:
   - Build command: `pnpm --filter web build`
   - Build output directory: `packages/web/dist`
   - Root directory: `/`
4. 環境変数に `VITE_CLERK_PUBLISHABLE_KEY` を設定

**Option B: Direct Upload**

```bash
cd packages/web
pnpm build
npx wrangler pages deploy dist --project-name=exam-app
```

#### 5. カスタムドメイン（任意）

Cloudflare Dashboard → Pages → Custom domains からドメインを設定。
Workers の API ルートは Pages Functions または Workers Routes で `/api/*` にマッピングする。

### 環境変数一覧

| 変数 | 設定先 | 用途 |
|------|--------|------|
| `CLERK_SECRET_KEY` | Workers Secret | サーバー側 Clerk 認証 |
| `VITE_CLERK_PUBLISHABLE_KEY` | Pages 環境変数 | クライアント側 Clerk |

## ライセンス

Private
