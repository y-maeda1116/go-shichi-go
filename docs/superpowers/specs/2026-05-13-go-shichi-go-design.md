# go-shichi-go (五七五) Design Spec

縦書きの俳句・短歌に特化したパブリックSNS。「制約から生まれる美」をコンセプトに、5-7-5 / 5-7-5-7-7の文字数制約を核としたプラットフォーム。

## 1. プロジェクト構造

```
go-shichi-go/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                    # Lint + TypeCheck + Test + Audit
│   └── dependabot.yml
├── configs/
│   └── .eslintrc.base.json           # security-base流用
├── drizzle/
│   └── migrations/                   # Drizzle生成のマイグレーション
├── src/
│   ├── client/
│   │   ├── components/
│   │   │   ├── PostForm.tsx          # 5-7-5[-7-7] 統一フォーム
│   │   │   ├── Timeline.tsx          # 縦書きタイムライン
│   │   │   ├── PostCard.tsx          # 個別投稿カード（縦書き）
│   │   │   ├── ProfileForm.tsx       # プロフィール編集
│   │   │   └── Layout.tsx            # ページレイアウト
│   │   ├── hooks/
│   │   │   ├── usePosts.ts           # TanStack Query 投稿取得
│   │   │   └── useAuth.ts            # 認証状態フック
│   │   ├── styles/
│   │   │   └── vertical.css          # 縦書き・明朝体スタイル
│   │   └── entry.tsx                 # クライアント側エントリ
│   ├── server/
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Cloudflare Access検証
│   │   │   ├── cache.ts              # Cache-Control ヘッダー
│   │   │   └── error.ts              # エラーハンドリング
│   │   ├── routes/
│   │   │   ├── posts.ts              # CRUD /api/posts
│   │   │   ├── users.ts              # /api/users
│   │   │   ├── upload.ts             # R2画像アップロード
│   │   │   └── pages.tsx             # SSR ページルート
│   │   ├── db/
│   │   │   ├── schema.ts             # Drizzle スキーマ定義
│   │   │   ├── queries.ts            # クエリヘルパー
│   │   │   └── client.ts             # Neon HTTP クライアント
│   │   ├── services/
│   │   │   ├── post.service.ts       # 投稿ビジネスロジック + 文字数バリデーション
│   │   │   └── user.service.ts       # ユーザービジネスロジック
│   │   └── utils/
│   │       ├── validator.ts          # 575/57577 文字数検証
│   │       └── r2.ts                 # R2 操作ヘルパー
│   └── app.ts                        # Hono アプリエントリ
├── public/
│   └── fonts/                        # Sawarabi Mincho 等のフォント
├── wrangler.toml
├── drizzle.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

**技術スタック**: Hono on Cloudflare Pages/Workers, Neon (PostgreSQL) + Drizzle ORM (neon-http driver), Cloudflare R2, Cloudflare Access (Zero Trust)

**レンダリング**: SSR + 部分ハイドレーション（Cloudflare AccessヘッダーをSSRで活用、クライアント側はTanStack Queryでインタラクティブ部分を管理）

## 2. データベーススキーマ

### `users` — プロフィール

| カラム | 型 | 制約 |
|--------|-----|------|
| id | uuid | PK, default gen |
| access_email | text | unique, not null |
| display_name | text | not null |
| bio | text | — |
| icon_url | text | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

`access_email`はCloudflare Accessの`Cf-Access-Authenticated-User-Email`ヘッダー値と一致。

### `posts` — 俳句・短歌の統一投稿

| カラム | 型 | 制約 |
|--------|-----|------|
| id | uuid | PK, default gen |
| user_id | uuid | FK → users, not null |
| type | text | not null, 'haiku' \| 'tanka' |
| line1 | text | not null — 上句 5文字 |
| line2 | text | not null — 上句 7文字 |
| line3 | text | not null — 上句 5文字 |
| line4 | text | 下句 7文字 (tankaのみ) |
| line5 | text | 下句 7文字 (tankaのみ) |
| author_note | text | 作者コメント（任意） |
| image_url | text | R2添付画像URL |
| season_word | text | 季語タグ |
| created_at | timestamp | — |

5行を個別カラムに分割することで文字数バリデーションをDB制約で表現し、縦書きレンダリングも行単位で扱いやすくしている。`type`は`line4`/`line5`の有無で自動判定するが、インデックス効率化のために明示的に保持。

### `likes` — いいね

| カラム | 型 | 制約 |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| post_id | uuid | FK → posts |
| created_at | timestamp | — |

UNIQUE(user_id, post_id) — 重複いいね防止。

## 3. APIルート & 認証フロー

### 認証フロー

```
リクエスト → Cloudflare Access → Cf-Access-Authenticated-User-Email ヘッダー
  ↓
auth.ts ミドルウェア:
  1. ヘッダーからemail抽出
  2. users テーブルで検索
  3. 存在しない → 302 /register（初回プロフィール登録）
  4. 存在する → c.set('user', user) で後続ルートに注入
```

### ページルート（SSR）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/` | タイムライン（SSR） |
| GET | `/register` | 初回プロフィール登録画面 |
| POST | `/register` | プロフィール作成 |

### 投稿API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/posts` | タイムライン取得（ページネーション） |
| POST | `/api/posts` | 新規投稿（要認証） |
| GET | `/api/posts/:id` | 投稿詳細 |
| DELETE | `/api/posts/:id` | 投稿削除（本人のみ） |

### ユーザーAPI

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/users/:id` | ユーザープロフィール |
| GET | `/api/users/:id/posts` | ユーザーの投稿一覧 |
| PUT | `/api/users/me` | プロフィール更新（要認証） |

### 画像・いいねAPI

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/upload` | R2へ画像アップロード（要認証） |
| POST | `/api/posts/:id/like` | いいね（要認証） |
| DELETE | `/api/posts/:id/like` | いいね解除（要認証） |

### キャッシュ戦略

- `GET /api/posts`: `Cache-Control: public, max-age=30, s-maxage=60`
- `GET /api/posts/:id`: `Cache-Control: public, max-age=60`
- ミューテーション後: TanStack Queryの`invalidateQueries`で即座にリフレッシュ
- Neon無料枠のコールドスタート対策として、Neon HTTPドライバ（ステートレス）を使用

## 4. フロントエンドコンポーネント & 縦書きCSS

### 縦書きCSS（`vertical.css`）

- フォント: `'Sawarabi Mincho', serif`
- `writing-mode: vertical-rl`
- `letter-spacing: 0.3em`（文字間のゆとり）
- `line-height: 2.5`（列間の余白）
- 投稿カード: 各行（line1〜line5）を縦列として右→左に配置。俳句は3列、短歌は5列。作者名は最左列に小さく表示
- レスポンシブ: モバイルでは1投稿ずつ横スクロール、デスクトップでは複数投稿を横並び

### コンポーネント

**`PostForm.tsx`** — 統一投稿フォーム
- 3行入力 → 自動で俳句判定
- 4行目以降入力 → 短歌モードに切替
- 各行の文字数をリアルタイム表示（5/7カウンター）
- 送信前に5-7-5 / 5-7-5-7-7バリデーション
- TanStack Queryの`useMutation`で投稿

**`Timeline.tsx`** — タイムライン
- `useQuery`で`/api/posts`を取得（`staleTime: 60000`）
- 無限スクロール（`useInfiniteQuery`）
- 下部に`PostForm`をアコーディオン形式で内蔵

**`PostCard.tsx`** — 個別投稿カード
- 縦書きで俳句/短歌を表示
- いいねボタン、作者名、投稿日時
- 添付画像があれば表示

**`ProfileForm.tsx`** — プロフィールフォーム
- 初回登録・編集兼用
- 表示名、自己紹介、アイコン画像（R2アップロード）

**`Layout.tsx`** — ページレイアウト
- SSRでレンダリング、クライアント側でハイドレーション
- ヘッダーにロゴ（五七五）、ナビゲーション

### クライアントエントリ（`entry.tsx`）

- TanStack Queryの`QueryClientProvider`でラップ
- SSRされたDOMノードに`createRoot`でハイドレーション
- `useAuth`フックで認証状態を管理（SSRコンテキストから初期値注入）

## 5. R2バケット用途

- プロフィールアイコン
- 投稿の添付画像
- システム画像（季語・背景）

## 6. セキュリティ

- Cloudflare Accessによる認証（Zero Trust）
- 入力バリデーション: フロントエンド + バックエンド双方で文字数検証
- security-baseリポジトリのベストプラクティス採用:
  - SHA-pinned GitHub Actions
  - ESLint security plugins
  - Dependabot + npm audit
  - 再利用可能なCIワークフロー
