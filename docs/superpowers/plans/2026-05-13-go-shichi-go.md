# go-shichi-go (五七五) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vertical-writing haiku/tanka SNS with Hono + Drizzle + Neon on Cloudflare Pages/Workers.

**Architecture:** SSR with React's renderToString on server, partial hydration with React + TanStack Query on client. Cloudflare Access handles auth via request headers. Neon HTTP driver for stateless DB access. R2 for image storage.

**Tech Stack:** Hono v4, React 19, TanStack Query v5, Drizzle ORM, @neondatabase/serverless, Cloudflare R2, Vite, Vitest

---

## File Structure

```
go-shichi-go/
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── dependabot.yml
├── configs/
│   └── .eslintrc.base.json
├── drizzle/
│   └── migrations/
├── src/
│   ├── client/
│   │   ├── components/
│   │   │   ├── PostForm.tsx          # 5-7-5[-7-7] unified form
│   │   │   ├── Timeline.tsx          # Vertical timeline with infinite scroll
│   │   │   ├── PostCard.tsx          # Individual post card (vertical)
│   │   │   ├── ProfileForm.tsx       # Profile edit/register
│   │   │   └── Layout.tsx            # Page shell with header
│   │   ├── hooks/
│   │   │   ├── usePosts.ts           # TanStack Query post fetching
│   │   │   └── useAuth.ts            # Auth state from SSR context
│   │   ├── styles/
│   │   │   └── vertical.css          # Vertical writing + Mincho font
│   │   └── entry.tsx                 # Client hydration entry
│   ├── server/
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Cloudflare Access header validation
│   │   │   ├── cache.ts              # Cache-Control headers
│   │   │   └── error.ts              # Error handling
│   │   ├── routes/
│   │   │   ├── posts.ts              # /api/posts CRUD
│   │   │   ├── users.ts              # /api/users
│   │   │   ├── upload.ts             # /api/upload R2
│   │   │   └── pages.tsx             # SSR page routes
│   │   ├── db/
│   │   │   ├── schema.ts             # Drizzle table definitions
│   │   │   ├── queries.ts            # Query helpers
│   │   │   └── client.ts             # Neon HTTP client
│   │   ├── services/
│   │   │   ├── post.service.ts       # Post business logic + validation
│   │   │   └── user.service.ts       # User business logic
│   │   └── utils/
│   │       ├── validator.ts          # 575/57577 character count
│   │       └── r2.ts                 # R2 upload/delete helpers
│   ├── app.ts                        # Hono app entry
│   └── types.ts                      # Shared TypeScript types
├── test/
│   ├── server/
│   │   ├── utils/
│   │   │   └── validator.test.ts
│   │   ├── services/
│   │   │   ├── post.service.test.ts
│   │   │   └── user.service.test.ts
│   │   └── routes/
│   │       ├── posts.test.ts
│   │       └── users.test.ts
│   └── client/
│       ├── components/
│       │   ├── PostCard.test.tsx
│       │   └── PostForm.test.tsx
│       └── hooks/
│           └── usePosts.test.ts
├── public/
│   └── fonts/
├── drizzle.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `drizzle.config.ts`
- Create: `.gitignore` (update)

- [ ] **Step 1: Create package.json with all dependencies**

```json
{
  "name": "go-shichi-go",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler pages dev -- vite",
    "build": "vite build",
    "build:client": "vite build --outDir dist/client",
    "preview": "wrangler pages dev dist",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install hono react react-dom @tanstack/react-query drizzle-orm @neondatabase/serverless
npm install -D typescript vite vitest @cloudflare/workers-types @hono/vite-cloudflare-pages wrangler drizzle-kit eslint eslint-plugin-security @testing-library/react @testing-library/jest-dom jsdom happy-dom
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["@cloudflare/workers-types", "vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: resolve(__dirname, 'src/client/entry.tsx'),
    },
  },
})
```

- [ ] **Step 5: Create drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:
```
node_modules/
dist/
.wrangler/
.dev.vars
.env
.env.*
.drizzle/
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: project scaffolding with package.json, tsconfig, vite, drizzle configs"
```

---

### Task 2: Wrangler & Cloudflare Configuration

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Create wrangler.toml**

```toml
name = "go-shichi-go"
compatibility_date = "2024-12-01"
pages_build_output_dir = "./dist"

[vars]
ENVIRONMENT = "production"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "go-shichi-go-images"

[placement]
mode = "smart"
```

- [ ] **Step 2: Create .dev.vars template**

```
DATABASE_URL=postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add wrangler.toml with R2 bucket and env config"
```

---

### Task 3: CI/CD & ESLint

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`
- Create: `configs/.eslintrc.base.json`

- [ ] **Step 1: Create .github/workflows/ci.yml**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ci:
    name: Lint + TypeCheck + Test + Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd

      - name: Set up Node.js
        uses: actions/setup-node@48b55a011bda9f5d6a1e23e37211e3254c1c064e
        with:
          node-version: "24"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm test

      - name: Run npm audit
        run: npm audit --audit-level=high
```

- [ ] **Step 2: Create .github/dependabot.yml**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "automated"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "automated"
```

- [ ] **Step 3: Create configs/.eslintrc.base.json**

```json
{
  "root": true,
  "env": {
    "es2022": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["security"],
  "extends": [
    "eslint:recommended",
    "plugin:security/recommended"
  ],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "warn",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-callback-in-promise": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-url": "error",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-unsafe-assignment": "error",
    "security/detect-unsafe-negation": "error"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .github/ configs/
git commit -m "chore: add CI/CD pipeline and ESLint security config"
```

---

### Task 4: Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create shared TypeScript types**

```typescript
export interface User {
  id: string
  accessEmail: string
  displayName: string
  bio: string | null
  iconUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type PostType = 'haiku' | 'tanka'

export interface Post {
  id: string
  userId: string
  type: PostType
  line1: string
  line2: string
  line3: string
  line4: string | null
  line5: string | null
  authorNote: string | null
  imageUrl: string | null
  seasonWord: string | null
  createdAt: Date
}

export interface PostWithAuthor extends Post {
  author: Pick<User, 'id' | 'displayName' | 'iconUrl'>
  likeCount: number
  likedByMe: boolean
}

export interface Like {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export interface AuthUser {
  id: string
  accessEmail: string
  displayName: string
  iconUrl: string | null
}

export interface CreatePostInput {
  line1: string
  line2: string
  line3: string
  line4?: string
  line5?: string
  authorNote?: string
  imageUrl?: string
  seasonWord?: string
}

export interface CreateProfileInput {
  displayName: string
  bio?: string
  iconUrl?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript types for users, posts, likes"
```

---

### Task 5: 575/57577 Validator

**Files:**
- Create: `src/server/utils/validator.ts`
- Create: `test/server/utils/validator.test.ts`

- [ ] **Step 1: Write failing tests for validator**

```typescript
import { describe, it, expect } from 'vitest'
import { validateHaiku, validateTanka, validatePost } from '@/server/utils/validator'

describe('validateHaiku', () => {
  it('accepts valid 5-7-5', () => {
    const result = validateHaiku({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects line1 not 5 chars', () => {
    const result = validateHaiku({
      line1: '古池',
      line2: '蛙飛び込む',
      line3: '水の音',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上句の上（5文字）が5文字ではありません')
  })

  it('rejects line2 not 7 chars', () => {
    const result = validateHaiku({
      line1: '古池や',
      line2: '蛙飛び込',
      line3: '水の音',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上句の中（7文字）が7文字ではありません')
  })

  it('rejects line3 not 5 chars', () => {
    const result = validateHaiku({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上句の下（5文字）が5文字ではありません')
  })

  it('rejects empty lines', () => {
    const result = validateHaiku({
      line1: '',
      line2: '蛙飛び込む',
      line3: '水の音',
    })
    expect(result.valid).toBe(false)
  })
})

describe('validateTanka', () => {
  it('accepts valid 5-7-5-7-7', () => {
    const result = validateTanka({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入る',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects line4 not 7 chars', () => {
    const result = validateTanka({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさ',
      line5: '岩にしみ入る',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の上（7文字）が7文字ではありません')
  })

  it('rejects line5 not 7 chars', () => {
    const result = validateTanka({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の下（7文字）が7文字ではありません')
  })
})

describe('validatePost', () => {
  it('detects haiku when only 3 lines', () => {
    const result = validatePost({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
    })
    expect(result.valid).toBe(true)
    expect(result.type).toBe('haiku')
  })

  it('detects tanka when 5 lines', () => {
    const result = validatePost({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入る',
    })
    expect(result.valid).toBe(true)
    expect(result.type).toBe('tanka')
  })

  it('rejects partial tanka (only line4)', () => {
    const result = validatePost({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('短歌の場合は下句の下（7文字）も入力してください')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/server/utils/validator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement validator**

```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface HaikuInput {
  line1: string
  line2: string
  line3: string
}

interface TankaInput extends HaikuInput {
  line4: string
  line5: string
}

interface PostInput extends HaikuInput {
  line4?: string
  line5?: string
}

interface PostValidationResult extends ValidationResult {
  type: 'haiku' | 'tanka'
}

function countChars(text: string): number {
  return [...text].length
}

export function validateHaiku(input: HaikuInput): ValidationResult {
  const errors: string[] = []

  if (countChars(input.line1) !== 5) {
    errors.push('上句の上（5文字）が5文字ではありません')
  }
  if (countChars(input.line2) !== 7) {
    errors.push('上句の中（7文字）が7文字ではありません')
  }
  if (countChars(input.line3) !== 5) {
    errors.push('上句の下（5文字）が5文字ではありません')
  }

  return { valid: errors.length === 0, errors }
}

export function validateTanka(input: TankaInput): ValidationResult {
  const haikuResult = validateHaiku(input)
  const errors = [...haikuResult.errors]

  if (countChars(input.line4) !== 7) {
    errors.push('下句の上（7文字）が7文字ではありません')
  }
  if (countChars(input.line5) !== 7) {
    errors.push('下句の下（7文字）が7文字ではありません')
  }

  return { valid: errors.length === 0, errors }
}

export function validatePost(input: PostInput): PostValidationResult {
  const hasLine4 = input.line4 !== undefined && input.line4 !== ''
  const hasLine5 = input.line5 !== undefined && input.line5 !== ''

  if (hasLine4 && !hasLine5) {
    return {
      valid: false,
      type: 'tanka',
      errors: ['短歌の場合は下句の下（7文字）も入力してください'],
    }
  }

  if (hasLine5 && !hasLine4) {
    return {
      valid: false,
      type: 'tanka',
      errors: ['短歌の場合は下句の上（7文字）も入力してください'],
    }
  }

  if (hasLine4 && hasLine5) {
    const result = validateTanka({
      ...input,
      line4: input.line4!,
      line5: input.line5!,
    })
    return { ...result, type: 'tanka' }
  }

  const result = validateHaiku(input)
  return { ...result, type: 'haiku' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/server/utils/validator.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/utils/validator.ts test/server/utils/validator.test.ts
git commit -m "feat: add 575/57577 character count validator with tests"
```

---

### Task 6: Database Schema & Client

**Files:**
- Create: `src/server/db/schema.ts`
- Create: `src/server/db/client.ts`
- Create: `src/server/db/queries.ts`

- [ ] **Step 1: Create Drizzle schema**

```typescript
import { pgTable, pgUuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: pgUuid('id').defaultRandom().primaryKey(),
  accessEmail: text('access_email').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  iconUrl: text('icon_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: pgUuid('id').defaultRandom().primaryKey(),
  userId: pgUuid('user_id').notNull().references(() => users.id),
  type: text('type', { enum: ['haiku', 'tanka'] }).notNull(),
  line1: text('line1').notNull(),
  line2: text('line2').notNull(),
  line3: text('line3').notNull(),
  line4: text('line4'),
  line5: text('line5'),
  authorNote: text('author_note'),
  imageUrl: text('image_url'),
  seasonWord: text('season_word'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const likes = pgTable('likes', {
  id: pgUuid('id').defaultRandom().primaryKey(),
  userId: pgUuid('user_id').notNull().references(() => users.id),
  postId: pgUuid('post_id').notNull().references(() => posts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('likes_user_post_unique').on(table.userId, table.postId),
])
```

- [ ] **Step 2: Create Neon HTTP client**

```typescript
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

function getDb(databaseUrl: string) {
  const sql = neon(databaseUrl)
  return drizzle(sql, { schema })
}

export { getDb }
```

- [ ] **Step 3: Create query helpers**

```typescript
import { eq, desc, count, and, lt } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Db = NeonHttpDatabase<typeof schema>

const POSTS_PAGE_SIZE = 20

export async function findUserByEmail(db: Db, email: string) {
  const rows = await db.select().from(schema.users)
    .where(eq(schema.users.accessEmail, email))
    .limit(1)
  return rows[0] ?? null
}

export async function findUserById(db: Db, id: string) {
  const rows = await db.select().from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createUser(db: Db, data: {
  accessEmail: string
  displayName: string
  bio?: string
  iconUrl?: string
}) {
  const rows = await db.insert(schema.users).values(data).returning()
  return rows[0]
}

export async function updateUser(db: Db, userId: string, data: {
  displayName?: string
  bio?: string
  iconUrl?: string
}) {
  const rows = await db.update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning()
  return rows[0]
}

export async function getTimelinePosts(db: Db, cursor?: string) {
  let query = db.select({
    post: schema.posts,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
    .orderBy(desc(schema.posts.createdAt))
    .limit(POSTS_PAGE_SIZE + 1)

  if (cursor) {
    const cursorPost = await db.select({ createdAt: schema.posts.createdAt })
      .from(schema.posts)
      .where(eq(schema.posts.id, cursor))
      .limit(1)
    if (cursorPost[0]) {
      query = query.where(lt(schema.posts.createdAt, cursorPost[0].createdAt))
    }
  }

  const rows = await query
  const hasMore = rows.length > POSTS_PAGE_SIZE
  const data = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = hasMore ? data[data.length - 1].post.id : null

  return { data, nextCursor }
}

export async function getPostById(db: Db, postId: string) {
  const rows = await db.select({
    post: schema.posts,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
    .where(eq(schema.posts.id, postId))
    .limit(1)
  return rows[0] ?? null
}

export async function getUserPosts(db: Db, userId: string, cursor?: string) {
  let query = db.select({
    post: schema.posts,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
    .where(eq(schema.posts.userId, userId))
    .orderBy(desc(schema.posts.createdAt))
    .limit(POSTS_PAGE_SIZE + 1)

  if (cursor) {
    const cursorPost = await db.select({ createdAt: schema.posts.createdAt })
      .from(schema.posts)
      .where(eq(schema.posts.id, cursor))
      .limit(1)
    if (cursorPost[0]) {
      query = query.where(
        and(
          eq(schema.posts.userId, userId),
          lt(schema.posts.createdAt, cursorPost[0].createdAt)
        )
      )
    }
  }

  const rows = await query
  const hasMore = rows.length > POSTS_PAGE_SIZE
  const data = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = hasMore ? data[data.length - 1].post.id : null

  return { data, nextCursor }
}

export async function createPost(db: Db, data: {
  userId: string
  type: 'haiku' | 'tanka'
  line1: string
  line2: string
  line3: string
  line4?: string
  line5?: string
  authorNote?: string
  imageUrl?: string
  seasonWord?: string
}) {
  const rows = await db.insert(schema.posts).values(data).returning()
  return rows[0]
}

export async function deletePost(db: Db, postId: string, userId: string) {
  const result = await db.delete(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId)))
    .returning()
  return result.length > 0
}

export async function getLikeCount(db: Db, postId: string) {
  const rows = await db.select({ count: count() })
    .from(schema.likes)
    .where(eq(schema.likes.postId, postId))
  return rows[0]?.count ?? 0
}

export async function toggleLike(db: Db, userId: string, postId: string): Promise<'liked' | 'unliked'> {
  const existing = await db.select()
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(schema.likes)
      .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    return 'unliked'
  }

  await db.insert(schema.likes).values({ userId, postId })
  return 'liked'
}

export async function hasUserLiked(db: Db, userId: string, postId: string) {
  const rows = await db.select()
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)
  return rows.length > 0
}
```

- [ ] **Step 4: Commit**

```bash
git add src/server/db/
git commit -m "feat: add Drizzle schema, Neon client, and query helpers"
```

---

### Task 7: R2 Upload Helper

**Files:**
- Create: `src/server/utils/r2.ts`

- [ ] **Step 1: Create R2 helper**

```typescript
import type { R2Bucket } from '@cloudflare/workers-types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadImage(
  bucket: R2Bucket,
  file: File,
): Promise<{ key: string; url: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('ファイルサイズは5MB以下にしてください')
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('JPEG、PNG、WebP、GIFのみアップロード可能です')
  }

  const ext = file.type.split('/')[1]
  const key = `uploads/${crypto.randomUUID()}.${ext}`
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  return { key, url: `/${key}` }
}

export async function deleteImage(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/utils/r2.ts
git commit -m "feat: add R2 image upload/delete helpers"
```

---

### Task 8: Server Middleware

**Files:**
- Create: `src/server/middleware/auth.ts`
- Create: `src/server/middleware/cache.ts`
- Create: `src/server/middleware/error.ts`

- [ ] **Step 1: Create auth middleware**

```typescript
import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import type { AuthUser } from '@/types'

type Env = {
  Variables: { user: AuthUser }
  Bindings: { DB: string }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email')

  if (!email) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }

  const { getDb } = await import('@/server/db/client')
  const { findUserByEmail } = await import('@/server/db/queries')
  const db = getDb(c.env.DATABASE_URL)
  const user = await findUserByEmail(db, email)

  if (!user) {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ success: false, error: 'プロフィール登録が必要です' }, 403)
    }
    return c.redirect('/register')
  }

  c.set('user', {
    id: user.id,
    accessEmail: user.accessEmail,
    displayName: user.displayName,
    iconUrl: user.iconUrl,
  })

  await next()
})

export const optionalAuthMiddleware = createMiddleware<Env>(async (c, next) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email')

  if (email) {
    const { getDb } = await import('@/server/db/client')
    const { findUserByEmail } = await import('@/server/db/queries')
    const db = getDb(c.env.DATABASE_URL)
    const user = await findUserByEmail(db, email)

    if (user) {
      c.set('user', {
        id: user.id,
        accessEmail: user.accessEmail,
        displayName: user.displayName,
        iconUrl: user.iconUrl,
      })
    }
  }

  await next()
})

export function getEmailFromHeader(c: Context): string | undefined {
  return c.req.header('Cf-Access-Authenticated-User-Email')
}
```

- [ ] **Step 2: Create cache middleware**

```typescript
import { createMiddleware } from 'hono/factory'

export const cacheMiddleware = (maxAge: number, sMaxAge?: number) =>
  createMiddleware(async (c, next) => {
    await next()
    const parts = [`public, max-age=${maxAge}`]
    if (sMaxAge !== undefined) {
      parts.push(`s-maxage=${sMaxAge}`)
    }
    c.header('Cache-Control', parts.join(', '))
  })
```

- [ ] **Step 3: Create error middleware**

```typescript
import type { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`Error: ${err.message}`, err.stack)

  if (c.req.path.startsWith('/api/')) {
    return c.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      500,
    )
  }

  return c.html('<h1>500 Internal Server Error</h1>', 500)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/server/middleware/
git commit -m "feat: add auth, cache, and error middleware"
```

---

### Task 9: Server Services

**Files:**
- Create: `src/server/services/post.service.ts`
- Create: `src/server/services/user.service.ts`
- Create: `test/server/services/post.service.test.ts`
- Create: `test/server/services/user.service.test.ts`

- [ ] **Step 1: Write failing tests for post service**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createPostWithValidation } from '@/server/services/post.service'

const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
} as any

const mockQueries = {
  createPost: vi.fn(),
  deletePost: vi.fn(),
}

describe('createPostWithValidation', () => {
  it('creates a valid haiku', async () => {
    const input = {
      userId: 'user-1',
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
    }

    mockQueries.createPost.mockResolvedValue({
      id: 'post-1',
      ...input,
      type: 'haiku',
      line4: null,
      line5: null,
      authorNote: null,
      imageUrl: null,
      seasonWord: null,
      createdAt: new Date(),
    })

    const result = await createPostWithValidation(mockQueries, input)
    expect(result.success).toBe(true)
    expect(result.data?.type).toBe('haiku')
  })

  it('rejects invalid character count', async () => {
    const input = {
      userId: 'user-1',
      line1: '古池',
      line2: '蛙飛び込む',
      line3: '水の音',
    }

    const result = await createPostWithValidation(mockQueries, input)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/server/services/post.service.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement post service**

```typescript
import { validatePost } from '@/server/utils/validator'
import type { CreatePostInput, ApiResponse, Post } from '@/types'

interface PostQueries {
  createPost: (data: {
    userId: string
    type: 'haiku' | 'tanka'
    line1: string
    line2: string
    line3: string
    line4?: string
    line5?: string
    authorNote?: string
    imageUrl?: string
    seasonWord?: string
  }) => Promise<Post>
  deletePost: (postId: string, userId: string) => Promise<boolean>
}

export async function createPostWithValidation(
  queries: PostQueries,
  input: CreatePostInput & { userId: string },
): Promise<ApiResponse<Post>> {
  const validation = validatePost(input)

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') }
  }

  const post = await queries.createPost({
    userId: input.userId,
    type: validation.type,
    line1: input.line1,
    line2: input.line2,
    line3: input.line3,
    line4: input.line4 || undefined,
    line5: input.line5 || undefined,
    authorNote: input.authorNote || undefined,
    imageUrl: input.imageUrl || undefined,
    seasonWord: input.seasonWord || undefined,
  })

  return { success: true, data: post }
}

export async function deletePostWithAuth(
  queries: PostQueries,
  postId: string,
  userId: string,
): Promise<ApiResponse<boolean>> {
  const deleted = await queries.deletePost(postId, userId)

  if (!deleted) {
    return { success: false, error: '投稿が見つかりません' }
  }

  return { success: true, data: true }
}
```

- [ ] **Step 4: Implement user service**

```typescript
import type { ApiResponse, User, CreateProfileInput } from '@/types'

interface UserQueries {
  findUserByEmail: (email: string) => Promise<User | null>
  findUserById: (id: string) => Promise<User | null>
  createUser: (data: {
    accessEmail: string
    displayName: string
    bio?: string
    iconUrl?: string
  }) => Promise<User>
  updateUser: (userId: string, data: {
    displayName?: string
    bio?: string
    iconUrl?: string
  }) => Promise<User>
}

export async function registerUser(
  queries: UserQueries,
  email: string,
  input: CreateProfileInput,
): Promise<ApiResponse<User>> {
  if (!input.displayName || input.displayName.trim().length === 0) {
    return { success: false, error: '表示名は必須です' }
  }

  const existing = await queries.findUserByEmail(email)
  if (existing) {
    return { success: false, error: 'すでに登録されています' }
  }

  const user = await queries.createUser({
    accessEmail: email,
    displayName: input.displayName.trim(),
    bio: input.bio?.trim() || undefined,
    iconUrl: input.iconUrl || undefined,
  })

  return { success: true, data: user }
}

export async function updateProfile(
  queries: UserQueries,
  userId: string,
  input: Partial<CreateProfileInput>,
): Promise<ApiResponse<User>> {
  if (input.displayName !== undefined && input.displayName.trim().length === 0) {
    return { success: false, error: '表示名は必須です' }
  }

  const user = await queries.updateUser(userId, {
    displayName: input.displayName?.trim(),
    bio: input.bio?.trim(),
    iconUrl: input.iconUrl,
  })

  return { success: true, data: user }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/server/services/`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/services/ test/server/services/
git commit -m "feat: add post and user services with validation and tests"
```

---

### Task 10: API Routes — Posts

**Files:**
- Create: `src/server/routes/posts.ts`
- Create: `test/server/routes/posts.test.ts`

- [ ] **Step 1: Write failing route tests**

```typescript
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import postsRoutes from '@/server/routes/posts'

describe('GET /api/posts', () => {
  it('returns paginated posts', async () => {
    const app = new Hono()
    app.route('/api/posts', postsRoutes)

    const res = await app.request('/api/posts')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data?.data)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/server/routes/posts.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement posts routes**

```typescript
import { Hono } from 'hono'
import { authMiddleware, optionalAuthMiddleware } from '@/server/middleware/auth'
import { cacheMiddleware } from '@/server/middleware/cache'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { createPostWithValidation, deletePostWithAuth } from '@/server/services/post.service'
import type { AuthUser } from '@/types'

const posts = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

posts.get('/',
  cacheMiddleware(30, 60),
  optionalAuthMiddleware,
  async (c) => {
    const db = getDb(c.env.DATABASE_URL)
    const cursor = c.req.query('cursor')
    const result = await queries.getTimelinePosts(db, cursor)

    const user = c.get('user')
    const dataWithLikes = await Promise.all(
      result.data.map(async (row) => {
        const likeCount = await queries.getLikeCount(db, row.post.id)
        const likedByMe = user
          ? await queries.hasUserLiked(db, user.id, row.post.id)
          : false
        return {
          ...row.post,
          author: row.author,
          likeCount,
          likedByMe,
        }
      }),
    )

    return c.json({
      success: true,
      data: { data: dataWithLikes, nextCursor: result.nextCursor },
    })
  },
)

posts.post('/', authMiddleware, async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const db = getDb(c.env.DATABASE_URL)

  const result = await createPostWithValidation(
    { createPost: (data) => queries.createPost(db, data) },
    { ...body, userId: user.id },
  )

  if (!result.success) {
    return c.json(result, 400)
  }
  return c.json(result, 201)
})

posts.get('/:id', cacheMiddleware(60), optionalAuthMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const postId = c.req.param('id')
  const row = await queries.getPostById(db, postId)

  if (!row) {
    return c.json({ success: false, error: '投稿が見つかりません' }, 404)
  }

  const likeCount = await queries.getLikeCount(db, postId)
  const user = c.get('user')
  const likedByMe = user
    ? await queries.hasUserLiked(db, user.id, postId)
    : false

  return c.json({
    success: true,
    data: { ...row.post, author: row.author, likeCount, likedByMe },
  })
})

posts.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)

  const result = await deletePostWithAuth(
    { createPost: () => Promise.resolve({} as any), deletePost: (id, uid) => queries.deletePost(db, id, uid) },
    postId,
    user.id,
  )

  if (!result.success) {
    return c.json(result, 404)
  }
  return c.json({ success: true })
})

posts.post('/:id/like', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)

  const action = await queries.toggleLike(db, user.id, postId)
  return c.json({ success: true, data: { action } })
})

export default posts
```

- [ ] **Step 4: Run tests**

Run: `npm test -- test/server/routes/posts.test.ts`
Expected: ALL PASS (with mocked DB)

- [ ] **Step 5: Commit**

```bash
git add src/server/routes/posts.ts test/server/routes/posts.test.ts
git commit -m "feat: add posts API routes with pagination, CRUD, and likes"
```

---

### Task 11: API Routes — Users & Upload

**Files:**
- Create: `src/server/routes/users.ts`
- Create: `src/server/routes/upload.ts`

- [ ] **Step 1: Implement users routes**

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { updateProfile } from '@/server/services/user.service'
import type { AuthUser } from '@/types'

const users = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

users.get('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const userId = c.req.param('id')
  const user = await queries.findUserById(db, userId)

  if (!user) {
    return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      displayName: user.displayName,
      bio: user.bio,
      iconUrl: user.iconUrl,
      createdAt: user.createdAt,
    },
  })
})

users.get('/:id/posts', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const userId = c.req.param('id')
  const cursor = c.req.query('cursor')
  const result = await queries.getUserPosts(db, userId, cursor)

  const dataWithLikes = await Promise.all(
    result.data.map(async (row) => {
      const likeCount = await queries.getLikeCount(db, row.post.id)
      return { ...row.post, author: row.author, likeCount, likedByMe: false }
    }),
  )

  return c.json({
    success: true,
    data: { data: dataWithLikes, nextCursor: result.nextCursor },
  })
})

users.put('/me', authMiddleware, async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const db = getDb(c.env.DATABASE_URL)

  const result = await updateProfile(
    {
      findUserByEmail: (email) => queries.findUserByEmail(db, email),
      findUserById: (id) => queries.findUserById(db, id),
      createUser: (data) => queries.createUser(db, data),
      updateUser: (id, data) => queries.updateUser(db, id, data),
    },
    user.id,
    body,
  )

  if (!result.success) {
    return c.json(result, 400)
  }
  return c.json(result)
})

export default users
```

- [ ] **Step 2: Implement upload route**

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { uploadImage } from '@/server/utils/r2'
import type { R2Bucket } from '@cloudflare/workers-types'
import type { AuthUser } from '@/types'

const upload = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { R2_BUCKET: R2Bucket }
}>()

upload.post('/', authMiddleware, async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: 'ファイルを選択してください' }, 400)
  }

  try {
    const result = await uploadImage(c.env.R2_BUCKET, file)
    return c.json({ success: true, data: result }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'アップロードに失敗しました'
    return c.json({ success: false, error: message }, 400)
  }
})

export default upload
```

- [ ] **Step 3: Commit**

```bash
git add src/server/routes/users.ts src/server/routes/upload.ts
git commit -m "feat: add users API and R2 upload routes"
```

---

### Task 12: SSR Page Routes

**Files:**
- Create: `src/server/routes/pages.tsx`

- [ ] **Step 1: Implement SSR page routes**

```tsx
import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'
import { Layout } from '@/client/components/Layout'
import { Timeline } from '@/client/components/Timeline'
import { ProfileForm } from '@/client/components/ProfileForm'
import { authMiddleware, optionalAuthMiddleware, getEmailFromHeader } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { findUserByEmail } from '@/server/db/queries'
import type { AuthUser } from '@/types'

const pages = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

function renderPage(component: React.ReactElement, user?: AuthUser) {
  const html = renderToString(
    <Layout user={user}>
      {component}
    </Layout>,
  )

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>五七五 — 俳句・短歌SNS</title>
  <link rel="stylesheet" href="/styles/vertical.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap">
</head>
<body>
  <div id="root">${html}</div>
  <script>window.__INITIAL_USER__ = ${user ? JSON.stringify(user) : 'null'};</script>
  <script src="/client/entry.js"></script>
</body>
</html>`
}

pages.get('/', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')
  const html = renderPage(<Timeline />, user)
  return c.html(html)
})

pages.get('/register', async (c) => {
  const email = getEmailFromHeader(c)
  if (!email) {
    return c.redirect('/')
  }

  const db = getDb(c.env.DATABASE_URL)
  const existing = await findUserByEmail(db, email)
  if (existing) {
    return c.redirect('/')
  }

  const html = renderPage(<ProfileForm mode="register" email={email} />)
  return c.html(html)
})

pages.post('/register', async (c) => {
  const email = getEmailFromHeader(c)
  if (!email) {
    return c.redirect('/')
  }

  const body = await c.req.formData()
  const db = getDb(c.env.DATABASE_URL)

  const existing = await findUserByEmail(db, email)
  if (existing) {
    return c.redirect('/')
  }

  await queries.createUser(db, {
    accessEmail: email,
    displayName: body.get('displayName') as string,
    bio: body.get('bio') as string || undefined,
    iconUrl: body.get('iconUrl') as string || undefined,
  })

  return c.redirect('/')
})

export default pages
```

- [ ] **Step 2: Commit**

```bash
git add src/server/routes/pages.tsx
git commit -m "feat: add SSR page routes for timeline, registration"
```

---

### Task 13: Hono App Entry Point

**Files:**
- Create: `src/app.ts`

- [ ] **Step 1: Create the main Hono application**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from '@/server/middleware/error'
import postsRoutes from '@/server/routes/posts'
import usersRoutes from '@/server/routes/users'
import uploadRoutes from '@/server/routes/upload'
import pagesRoutes from '@/server/routes/pages'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors())

app.route('/', pagesRoutes)
app.route('/api/posts', postsRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/upload', uploadRoutes)

app.onError(errorHandler)

export default app
```

- [ ] **Step 2: Commit**

```bash
git add src/app.ts
git commit -m "feat: add Hono app entry point with all routes"
```

---

### Task 14: Vertical Writing CSS

**Files:**
- Create: `src/client/styles/vertical.css`

- [ ] **Step 1: Create vertical writing stylesheet**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #faf8f5;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-text-secondary: #666666;
  --color-border: #d4cdc4;
  --color-accent: #8b4513;
  --color-accent-light: #f5e6d3;
  --font-mincho: 'Sawarabi Mincho', 'Noto Serif JP', serif;
}

body {
  font-family: var(--font-mincho);
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.8;
}

/* Layout */
.layout {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 24px;
}

.header-logo {
  writing-mode: vertical-rl;
  font-size: 24px;
  letter-spacing: 0.5em;
  color: var(--color-accent);
  text-decoration: none;
}

.header-nav {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.header-nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.header-nav a:hover {
  color: var(--color-accent);
}

/* Vertical Writing Base */
.vertical-text {
  writing-mode: vertical-rl;
  font-family: var(--font-mincho);
  letter-spacing: 0.3em;
  line-height: 2.5;
}

/* Post Card */
.post-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 20px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.post-card-lines {
  writing-mode: vertical-rl;
  font-family: var(--font-mincho);
  letter-spacing: 0.3em;
  line-height: 2.5;
  flex: 1;
  display: flex;
  flex-direction: row-reverse;
}

.post-line {
  white-space: nowrap;
}

.post-line + .post-line {
  padding-right: 0.5em;
  border-right: 1px solid transparent;
}

.post-author {
  writing-mode: vertical-rl;
  font-size: 12px;
  color: var(--color-text-secondary);
  letter-spacing: 0.2em;
  margin-top: 8px;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.like-button {
  background: none;
  border: 1px solid var(--color-border);
  padding: 4px 12px;
  cursor: pointer;
  font-family: var(--font-mincho);
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.like-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.like-button.liked {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-posts {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  scroll-snap-type: x mandatory;
}

.timeline-posts .post-card {
  min-width: 280px;
  scroll-snap-align: start;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .timeline-posts {
    flex-wrap: wrap;
    overflow-x: visible;
    scroll-snap-type: none;
  }

  .timeline-posts .post-card {
    min-width: unset;
    flex: 1;
    min-width: 240px;
  }
}

/* Post Form */
.post-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 20px;
}

.post-form-toggle {
  width: 100%;
  padding: 8px;
  background: var(--color-accent-light);
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-family: var(--font-mincho);
  font-size: 14px;
  color: var(--color-accent);
  text-align: center;
}

.post-form-body {
  margin-top: 16px;
}

.post-form-body.hidden {
  display: none;
}

.post-line-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.post-line-input input {
  font-family: var(--font-mincho);
  font-size: 18px;
  letter-spacing: 0.3em;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  width: 10em;
}

.post-line-input input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.char-count {
  font-size: 12px;
  min-width: 3em;
  text-align: right;
}

.char-count.valid {
  color: green;
}

.char-count.invalid {
  color: red;
}

.post-type-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  margin-bottom: 8px;
}

.post-form-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.btn-primary {
  padding: 8px 24px;
  background: var(--color-accent);
  color: white;
  border: none;
  cursor: pointer;
  font-family: var(--font-mincho);
  font-size: 14px;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Profile Form */
.profile-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 24px;
  max-width: 480px;
  margin: 0 auto;
}

.profile-form h2 {
  margin-bottom: 16px;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  font-family: var(--font-mincho);
  font-size: 14px;
  background: var(--color-bg);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

/* Season word tag */
.season-word {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: 2px;
  margin-left: 4px;
}

/* Attached image */
.post-image {
  max-width: 100%;
  max-height: 200px;
  margin-top: 8px;
  border: 1px solid var(--color-border);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/styles/vertical.css
git commit -m "feat: add vertical writing CSS with Mincho font and responsive layout"
```

---

### Task 15: PostCard & PostForm Components

**Files:**
- Create: `src/client/components/PostCard.tsx`
- Create: `src/client/components/PostForm.tsx`
- Create: `test/client/components/PostCard.test.tsx`
- Create: `test/client/components/PostForm.test.tsx`

- [ ] **Step 1: Write failing PostCard test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PostCard } from '@/client/components/PostCard'
import type { PostWithAuthor } from '@/types'

const mockHaiku: PostWithAuthor = {
  id: '1',
  userId: 'u1',
  type: 'haiku',
  line1: '古池や',
  line2: '蛙飛び込む',
  line3: '水の音',
  line4: null,
  line5: null,
  authorNote: null,
  imageUrl: null,
  seasonWord: null,
  createdAt: new Date('2026-01-01'),
  author: { id: 'u1', displayName: '芭蕉', iconUrl: null },
  likeCount: 5,
  likedByMe: false,
}

describe('PostCard', () => {
  it('renders haiku lines vertically', () => {
    const { container } = render(<PostCard post={mockHaiku} onLike={() => {}} />)
    expect(container.textContent).toContain('古池や')
    expect(container.textContent).toContain('蛙飛び込む')
    expect(container.textContent).toContain('水の音')
  })

  it('renders author name', () => {
    const { container } = render(<PostCard post={mockHaiku} onLike={() => {}} />)
    expect(container.textContent).toContain('芭蕉')
  })

  it('renders like count', () => {
    const { container } = render(<PostCard post={mockHaiku} onLike={() => {}} />)
    expect(container.textContent).toContain('5')
  })

  it('renders tanka with 5 lines', () => {
    const tanka: PostWithAuthor = {
      ...mockHaiku,
      type: 'tanka',
      line4: '静けさや',
      line5: '岩にしみ入る',
    }
    const { container } = render(<PostCard post={tanka} onLike={() => {}} />)
    expect(container.textContent).toContain('静けさや')
    expect(container.textContent).toContain('岩にしみ入る')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/client/components/PostCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement PostCard**

```tsx
import type { PostWithAuthor } from '@/types'

interface PostCardProps {
  post: PostWithAuthor
  onLike: (postId: string) => void
}

export function PostCard({ post, onLike }: PostCardProps) {
  const lines = [post.line1, post.line2, post.line3]
  if (post.line4) lines.push(post.line4)
  if (post.line5) lines.push(post.line5)

  return (
    <article className="post-card">
      <div className="post-card-lines">
        {lines.map((line, i) => (
          <span key={i} className="post-line">{line}</span>
        ))}
        <span className="post-author">{post.author.displayName}</span>
      </div>
      {post.seasonWord && (
        <span className="season-word">{post.seasonWord}</span>
      )}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="post-image" />
      )}
      <div className="post-meta">
        <time>{post.createdAt.toLocaleDateString('ja-JP')}</time>
        <button
          className={`like-button ${post.likedByMe ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          {post.likedByMe ? '♥' : '♡'} {post.likeCount}
        </button>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/client/components/PostCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Implement PostForm**

```tsx
import { useState, useCallback } from 'react'

interface PostFormProps {
  onSubmit: (data: {
    line1: string
    line2: string
    line3: string
    line4?: string
    line5?: string
  }) => Promise<void>
}

interface LineField {
  label: string
  expected: number
  key: string
}

const UPPER_LINES: LineField[] = [
  { label: '上（5文字）', expected: 5, key: 'line1' },
  { label: '中（7文字）', expected: 7, key: 'line2' },
  { label: '下（5文字）', expected: 5, key: 'line3' },
]

const LOWER_LINES: LineField[] = [
  { label: '下句上（7文字）', expected: 7, key: 'line4' },
  { label: '下句下（7文字）', expected: 7, key: 'line5' },
]

function countChars(text: string): number {
  return [...text].length
}

export function PostForm({ onSubmit }: PostFormProps) {
  const [values, setValues] = useState({
    line1: '', line2: '', line3: '', line4: '', line5: '',
  })
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasLowerLines = values.line4.length > 0 || values.line5.length > 0

  const handleChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const isValid = () => {
    const upperValid = UPPER_LINES.every(
      (f) => countChars(values[f.key as keyof typeof values]) === f.expected,
    )
    if (!hasLowerLines) return upperValid
    return upperValid && LOWER_LINES.every(
      (f) => countChars(values[f.key as keyof typeof values]) === f.expected,
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid() || submitting) return

    setSubmitting(true)
    try {
      const data: Record<string, string> = {
        line1: values.line1,
        line2: values.line2,
        line3: values.line3,
      }
      if (hasLowerLines) {
        data.line4 = values.line4
        data.line5 = values.line5
      }
      await onSubmit(data as any)
      setValues({ line1: '', line2: '', line3: '', line4: '', line5: '' })
      setExpanded(false)
    } finally {
      setSubmitting(false)
    }
  }

  const renderLineInput = (field: LineField) => {
    const value = values[field.key as keyof typeof values]
    const charCount = countChars(value)
    const valid = charCount === field.expected || charCount === 0

    return (
      <div key={field.key} className="post-line-input">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.label}
          maxLength={field.expected + 2}
        />
        <span className={`char-count ${charCount > 0 ? (valid ? 'valid' : 'invalid') : ''}`}>
          {charCount}/{field.expected}
        </span>
      </div>
    )
  }

  return (
    <div className="post-form">
      <button
        className="post-form-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '閉じる' : '投稿する'}
      </button>
      <form onSubmit={handleSubmit} className={`post-form-body ${expanded ? '' : 'hidden'}`}>
        <span className="post-type-badge">
          {hasLowerLines ? '短歌' : '俳句'}
        </span>
        {UPPER_LINES.map(renderLineInput)}
        {LOWER_LINES.map(renderLineInput)}
        <div className="post-form-actions">
          <button type="submit" className="btn-primary" disabled={!isValid() || submitting}>
            {submitting ? '投稿中...' : '投稿'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/client/components/PostCard.tsx src/client/components/PostForm.tsx test/client/components/PostCard.test.tsx
git commit -m "feat: add PostCard and PostForm components with tests"
```

---

### Task 16: Timeline Component

**Files:**
- Create: `src/client/components/Timeline.tsx`

- [ ] **Step 1: Implement Timeline**

```tsx
import { useState } from 'react'
import { usePosts } from '@/client/hooks/usePosts'
import { PostCard } from '@/client/components/PostCard'
import { PostForm } from '@/client/components/PostForm'

export function Timeline() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts()
  const [refreshKey, setRefreshKey] = useState(0)

  const posts = data?.pages.flatMap((page) => page.data) ?? []

  const handleLike = async (postId: string) => {
    await fetch('/api/posts/' + postId + '/like', { method: 'POST' })
    setRefreshKey((k) => k + 1)
  }

  const handlePost = async (input: {
    line1: string
    line2: string
    line3: string
    line4?: string
    line5?: string
  }) => {
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="timeline" key={refreshKey}>
      <PostForm onSubmit={handlePost} />
      <div className="timeline-posts">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))}
      </div>
      {hasNextPage && (
        <button
          className="btn-primary"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '読み込み中...' : 'もっと見る'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/Timeline.tsx
git commit -m "feat: add Timeline component with infinite scroll and post form"
```

---

### Task 17: ProfileForm & Layout Components

**Files:**
- Create: `src/client/components/ProfileForm.tsx`
- Create: `src/client/components/Layout.tsx`

- [ ] **Step 1: Implement ProfileForm**

```tsx
import { useState } from 'react'

interface ProfileFormProps {
  mode: 'register' | 'edit'
  email?: string
  initialData?: {
    displayName: string
    bio: string
    iconUrl: string
  }
}

export function ProfileForm({ mode, initialData }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? '')
  const [bio, setBio] = useState(initialData?.bio ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError('')

    try {
      const url = mode === 'register' ? '/register' : '/api/users/me'
      const method = mode === 'register' ? 'POST' : 'PUT'
      const headers: Record<string, string> = {}
      let body: FormData | string

      if (mode === 'register') {
        const formData = new FormData()
        formData.append('displayName', displayName)
        formData.append('bio', bio)
        body = formData
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({ displayName, bio })
      }

      const res = await fetch(url, { method, headers, body })

      if (res.ok) {
        if (mode === 'register') {
          window.location.href = '/'
        }
      } else {
        const data = await res.json()
        setError(data.error || 'エラーが発生しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="profile-form">
      <h2>{mode === 'register' ? 'プロフィール登録' : 'プロフィール編集'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>表示名</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Implement Layout**

```tsx
import type { ReactNode } from 'react'
import type { AuthUser } from '@/types'

interface LayoutProps {
  user?: AuthUser
  children: ReactNode
}

export function Layout({ user, children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <a href="/" className="header-logo">五七五</a>
        <nav className="header-nav">
          {user ? (
            <>
              <a href="/profile">{user.displayName}</a>
            </>
          ) : (
            <span>ゲスト</span>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/ProfileForm.tsx src/client/components/Layout.tsx
git commit -m "feat: add ProfileForm and Layout components"
```

---

### Task 18: Client Hooks

**Files:**
- Create: `src/client/hooks/usePosts.ts`
- Create: `src/client/hooks/useAuth.ts`
- Create: `test/client/hooks/usePosts.test.ts`

- [ ] **Step 1: Write failing usePosts test**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePosts } from '@/client/hooks/usePosts'

describe('usePosts', () => {
  it('fetches and returns posts', async () => {
    const mockPosts = {
      success: true,
      data: {
        data: [{ id: '1', type: 'haiku', line1: '古池や' }],
        nextCursor: null,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => usePosts(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0].data).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/client/hooks/usePosts.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement usePosts hook**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import type { PostWithAuthor, PaginatedResponse } from '@/types'

async function fetchPosts(cursor?: string): Promise<PaginatedResponse<PostWithAuthor>> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)

  const res = await fetch('/api/posts?' + params.toString())
  if (!res.ok) throw new Error('投稿の取得に失敗しました')

  const json = await res.json()
  return json.data
}

export function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  })
}
```

- [ ] **Step 4: Implement useAuth hook**

```typescript
import { useQuery } from '@tanstack/react-query'
import type { AuthUser } from '@/types'

declare global {
  interface Window {
    __INITIAL_USER__?: AuthUser | null
  }
}

export function useAuth() {
  const initialUser = typeof window !== 'undefined'
    ? window.__INITIAL_USER__
    : undefined

  return useQuery({
    queryKey: ['auth'],
    queryFn: () => Promise.resolve(initialUser ?? null),
    initialData: initialUser,
    staleTime: Infinity,
    enabled: false,
  })
}

export function useCurrentUser() {
  const { data } = useAuth()
  return data ?? null
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/client/hooks/usePosts.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/client/hooks/ test/client/hooks/
git commit -m "feat: add usePosts and useAuth hooks with TanStack Query"
```

---

### Task 19: Client Entry Point

**Files:**
- Create: `src/client/entry.tsx`

- [ ] **Step 1: Create client entry point for hydration**

```tsx
import { hydrateRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Timeline } from '@/client/components/Timeline'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: true,
    },
  },
})

const root = document.getElementById('root')
if (root) {
  hydrateRoot(
    root,
    <QueryClientProvider client={queryClient}>
      <Timeline />
    </QueryClientProvider>,
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/entry.tsx
git commit -m "feat: add client entry point with React hydration and TanStack Query"
```

---

### Task 20: Integration Verification

**Files:** None new — verification only.

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 2: Run type check**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address typecheck and lint issues from integration"
```
