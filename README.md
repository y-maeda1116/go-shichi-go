# go-shichi-go (五七五)

縦書きの俳句・短歌に特化したパブリックSNS。「制約から生まれる美」をコンセプトに、5-7-5 / 5-7-5-7-7の文字数制約を核としたプラットフォーム。

## Features

- **5-7-5 / 5-7-5-7-7 文字数バリデーション** — 俳句・短歌をリアルタイム検証
- **縦書きタイムライン** — `writing-mode: vertical-rl` + 明朝体（Sawarabi Mincho）
- **無限スクロール** — TanStack Query `useInfiniteQuery` + カーソルベースページネーション
- **季語フィルタ** — 春/夏/秋/冬/新年で絞り込み
- **ダークモード** — `localStorage` で永続化、和風ダークテーマ
- **OGP画像自動生成** — SVG形式で投稿内容をSNSシェア画像化
- **フォロー機能** — フォロー/フォロワー数表示
- **通知ベル** — いいね・フォローの通知をローカルストレージで管理
- **ハッシュタグ** — 作者コメント内の `#タグ` を自動抽出・表示
- **Cloudflare Access認証** — Zero TrustヘッダーによるSSR認証

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Hono v4 on Cloudflare Pages/Workers |
| Frontend | React 19 + TanStack Query v5 |
| Styling | Vanilla CSS (縦書き・明朝体) |
| Database | Neon (PostgreSQL) + Drizzle ORM (neon-http driver) |
| Storage | Cloudflare R2 |
| Auth | Cloudflare Access (Zero Trust) |
| Build | Vite + Vitest + TypeScript |
| CI/CD | GitHub Actions (SHA-pinned) + Dependabot |

## Project Structure

```
src/
├── app.ts                        # Hono app entry
├── types.ts                      # Shared TypeScript types
├── client/
│   ├── entry.tsx                 # Hydration entry
│   ├── components/
│   │   ├── Layout.tsx            # Page shell + dark mode toggle
│   │   ├── Timeline.tsx          # Infinite scroll timeline
│   │   ├── PostCard.tsx          # Vertical post card
│   │   ├── PostForm.tsx          # 5-7-5[-7-7] unified form
│   │   ├── PostDetail.tsx        # Post detail page
│   │   ├── ProfileForm.tsx       # Register/edit profile
│   │   ├── UserProfile.tsx       # User profile + follow
│   │   ├── Skeleton.tsx          # Loading skeletons
│   │   └── NotificationBell.tsx  # Notification dropdown
│   ├── hooks/
│   │   ├── usePosts.ts           # TanStack Query infinite posts
│   │   └── useAuth.ts            # Auth state from SSR context
│   └── styles/
│       └── vertical.css          # 縦書き + 明朝体 + dark mode
├── server/
│   ├── middleware/
│   │   ├── auth.ts               # Cloudflare Access header validation
│   │   ├── cache.ts              # Cache-Control headers
│   │   └── error.ts              # Error handling
│   ├── routes/
│   │   ├── posts.ts              # /api/posts CRUD + likes
│   │   ├── users.ts              # /api/users
│   │   ├── upload.ts             # /api/upload R2
│   │   ├── follow.ts             # /api/follow
│   │   ├── ogp.ts                # /ogp/posts/:id SVG generation
│   │   └── pages.tsx             # SSR page routes
│   ├── db/
│   │   ├── schema.ts             # Drizzle table definitions
│   │   ├── follow-schema.ts      # Follows table
│   │   ├── client.ts             # Neon HTTP client
│   │   ├── queries.ts            # Query helpers
│   │   └── follow-queries.ts     # Follow query helpers
│   ├── services/
│   │   ├── post.service.ts       # Post business logic
│   │   └── user.service.ts       # User business logic
│   └── utils/
│       ├── validator.ts          # 575/57577 character count
│       ├── r2.ts                 # R2 upload/delete
│       └── ogp.ts                # SVG OG image generator
test/
├── server/utils/validator.test.ts
├── client/components/PostCard.test.tsx
└── client/hooks/usePosts.test.tsx
```

## API

### Pages (SSR)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Timeline |
| GET | `/register` | Profile registration |
| POST | `/register` | Create profile |
| GET | `/profile` | Own profile |
| GET | `/profile/edit` | Edit profile |
| GET | `/users/:id` | User profile |
| GET | `/posts/:id` | Post detail |

### API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts` | Timeline (cursor + season filter) |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post |
| DELETE | `/api/posts/:id` | Delete post (own only) |
| POST | `/api/posts/:id/like` | Toggle like |
| GET | `/api/users/:id` | User info |
| GET | `/api/users/:id/posts` | User's posts |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/upload` | R2 image upload |
| POST | `/api/follow/:userId` | Follow |
| DELETE | `/api/follow/:userId` | Unfollow |
| GET | `/api/follow/status/:userId` | Follow status |
| GET | `/ogp/posts/:id` | OG image (SVG) |

## Getting Started

### Prerequisites

- Node.js 24+
- Neon PostgreSQL database
- Cloudflare account (Pages + Workers + R2 + Access)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your DATABASE_URL

# Generate and run migrations
npm run db:generate
npm run db:migrate

# Start dev server
npm run dev
```

### Scripts

```bash
npm run dev          # Wrangler Pages dev server
npm run build        # Production build
npm run test         # Run tests
npm run test:watch   # Watch mode tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint with security plugins
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
```

## License

Private
