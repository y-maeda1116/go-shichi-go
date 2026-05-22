# 日替わりお題 & シェア画像生成 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 日替わりお題機能と、投稿をSNSシェア用画像（和紙風/モダン）にする機能を追加する。

**Architecture:** DB に `daily_themes` テーブルを追加し、API で当日のお題を返す。画像は既存 OGP の SVG 生成を拡張して2テンプレート対応し、フロントエンドの Canvas で PNG 変換してダウンロードする。

**Tech Stack:** Drizzle ORM, Hono, React, TanStack Query, Canvas API

---

## Task 1: daily_themes テーブル定義

**Files:**
- Create: `src/server/db/themes-schema.ts`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: Create themes-schema.ts**

```typescript
// src/server/db/themes-schema.ts
import { pgTable, uuid, text, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core'

export const dailyThemes = pgTable('daily_themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  themeText: text('theme_text').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('daily_themes_date_unique').on(table.date),
])
```

- [ ] **Step 2: Add to drizzle.config.ts schema array**

In `drizzle.config.ts`, change the schema array to include the new file:

```typescript
schema: ['./src/server/db/schema.ts', './src/server/db/follow-schema.ts', './src/server/db/themes-schema.ts'],
```

- [ ] **Step 3: Generate and run migration**

Run: `npx drizzle-kit generate`
Then: `npx drizzle-kit migrate`

- [ ] **Step 4: Commit**

```bash
git add src/server/db/themes-schema.ts drizzle.config.ts drizzle/
git commit -m "feat: add daily_themes table schema"
```

---

## Task 2: テーマクエリ関数とテスト

**Files:**
- Modify: `src/server/db/queries.ts`
- Create: `test/server/db/theme-queries.test.ts`

- [ ] **Step 1: Write failing test for getThemeByDate**

```typescript
// test/server/db/theme-queries.test.ts
import { describe, it, expect } from 'vitest'
import { getThemeByDate, getTodayTheme } from '@/server/db/queries'

describe('theme queries', () => {
  it('getThemeByDate returns theme for given date', async () => {
    const mockTheme = { id: '1', date: '2026-05-22', themeText: '五月晴れ', description: '初夏の美しい天気', createdAt: new Date() }
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockTheme]),
          }),
        }),
      }),
    } as any
    const result = await getThemeByDate(db, '2026-05-22')
    expect(result).toEqual(mockTheme)
  })

  it('getTodayTheme returns theme for today', async () => {
    const mockTheme = { id: '1', date: '2026-05-22', themeText: '五月晴れ', description: null, createdAt: new Date() }
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockTheme]),
          }),
        }),
      }),
    } as any
    const result = await getTodayTheme(db)
    expect(result).toEqual(mockTheme)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/server/db/theme-queries.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Add query functions to queries.ts**

Append to `src/server/db/queries.ts`:

```typescript
import * as schema from './schema'

// Add at end of file:

export async function getThemeByDate(db: Db, date: string) {
  const rows = await db.select().from(schema.dailyThemes)
    .where(eq(schema.dailyThemes.date, date))
    .limit(1)
  return rows[0] ?? null
}

export async function getTodayTheme(db: Db) {
  const today = new Date().toISOString().split('T')[0]
  return getThemeByDate(db, today)
}
```

Also add `dailyThemes` to the schema import. In `src/server/db/schema.ts`, add at end:

```typescript
export { dailyThemes } from './themes-schema'
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/db/queries.ts src/server/db/schema.ts test/server/db/theme-queries.test.ts
git commit -m "feat: add theme query functions with tests"
```

---

## Task 3: テーマ API ルートとテスト

**Files:**
- Create: `src/server/routes/themes.ts`
- Modify: `src/app.ts`
- Create: `test/server/routes/themes.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// test/server/routes/themes.test.ts
import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'

// Mock the themes route module
vi.mock('@/server/db/client', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{
            id: '1', date: '2026-05-22', themeText: '五月晴れ', description: '初夏の天気', createdAt: new Date(),
          }]),
        }),
      }),
    }),
  }),
}))

import themesRoutes from '@/server/routes/themes'

describe('GET /api/themes/today', () => {
  it('returns today theme', async () => {
    const app = new Hono()
    app.route('/api/themes', themesRoutes)

    const res = await app.request('/api/themes/today')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.themeText).toBe('五月晴れ')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/server/routes/themes.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create themes route**

```typescript
// src/server/routes/themes.ts
import { Hono } from 'hono'
import { getDb } from '@/server/db/client'
import { getTodayTheme, getThemeByDate } from '@/server/db/queries'

const themes = new Hono<{
  Bindings: { DATABASE_URL: string }
}>()

themes.get('/today', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const theme = await getTodayTheme(db)

  if (!theme) {
    return c.json({ success: true, data: null })
  }

  return c.json({
    success: true,
    data: {
      date: theme.date,
      themeText: theme.themeText,
      description: theme.description,
    },
  })
})

themes.get('/:date', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const date = c.req.param('date')
  const theme = await getThemeByDate(db, date)

  if (!theme) {
    return c.json({ success: true, data: null })
  }

  return c.json({
    success: true,
    data: {
      date: theme.date,
      themeText: theme.themeText,
      description: theme.description,
    },
  })
})

export default themes
```

- [ ] **Step 4: Register route in app.ts**

In `src/app.ts`, add import and route:

```typescript
import themesRoutes from '@/server/routes/themes'
// ...
app.route('/api/themes', themesRoutes)
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/routes/themes.ts src/app.ts test/server/routes/themes.test.ts
git commit -m "feat: add themes API route with /today and /:date endpoints"
```

---

## Task 4: シードスクリプト

**Files:**
- Create: `scripts/seed-themes.ts`
- Modify: `package.json`

- [ ] **Step 1: Create seed script**

```typescript
// scripts/seed-themes.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql, { schema: await import('../src/server/db/themes-schema') })
const { dailyThemes } = await import('../src/server/db/themes-schema')

const SPRING = ['桜', '春風', '霞', 'つくし', '雛菊', '春の海', '若葉', '花見', '春の月', '鶯', '梅', '春雷', '春の雨', '菜の花', '春分', 'あした咲く', 'こもれび', '春泥', '新学期', '春の川']
const SUMMER = ['蝉', '入道雲', '向日葵', '夕立', '蛍', '花火', '海', '風鈴', 'かき氷', '浴衣', '夏の月', '朝顔', '金魚', '麦わら帽子', '夏の海', 'ひまわり', '夕凪', '夜風', '流れ星', '夏休み']
const AUTUMN = ['紅葉', '月', '秋風', '栗', '柿', '稲刈り', '秋の空', '菊', '虫の声', '十五夜', '秋の雨', '彼岸花', '秋の朝', 'もみじ', '秋晴れ', '夜長', '秋の川', '松茸', 'ススキ', '秋分']
const WINTER = ['雪', '椿', '冬の月', '氷', 'こたつ', '鍋', '初雪', '霜', '冬の海', '木枯らし', 'みかん', '暖簾', '冬の朝', '山茶花', '大晦日', '正月', '門松', '初夢', '寒椿', '冬の星']

const SEASONS = [
  { months: [3, 4, 5], themes: SPRING },
  { months: [6, 7, 8], themes: SUMMER },
  { months: [9, 10, 11], themes: AUTUMN },
  { months: [12, 1, 2], themes: WINTER },
]

function getSeasonThemes(month: number): string[] {
  return SEASONS.find(s => s.months.includes(month))?.themes ?? SPRING
}

const start = new Date('2026-01-01')
const end = new Date('2027-12-31')
const values: { date: string; themeText: string }[] = []

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const month = d.getMonth() + 1
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  const themes = getSeasonThemes(month)
  const themeText = themes[dayOfYear % themes.length]
  const dateStr = d.toISOString().split('T')[0]
  values.push({ date: dateStr, themeText })
}

console.log(`Seeding ${values.length} daily themes...`)

for (const val of values) {
  await db.insert(dailyThemes).values(val).onConflictDoNothing().execute()
}

console.log('Done!')
```

- [ ] **Step 2: Add npm script**

In `package.json` scripts, add:

```json
"db:seed-themes": "npx tsx scripts/seed-themes.ts"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-themes.ts package.json
git commit -m "feat: add daily themes seed script"
```

---

## Task 5: フロントエンド — useTodayTheme フックと ThemeCard

**Files:**
- Create: `src/client/hooks/useTodayTheme.ts`
- Create: `src/client/components/ThemeCard.tsx`
- Modify: `src/client/components/Timeline.tsx`

- [ ] **Step 1: Create useTodayTheme hook**

```typescript
// src/client/hooks/useTodayTheme.ts
import { useQuery } from '@tanstack/react-query'

interface TodayTheme {
  date: string
  themeText: string
  description: string | null
}

export function useTodayTheme() {
  return useQuery({
    queryKey: ['theme', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/themes/today')
      if (!res.ok) throw new Error('お題の取得に失敗しました')
      const json = await res.json() as { success: boolean; data: TodayTheme | null }
      return json.data
    },
    staleTime: 300000,
  })
}
```

- [ ] **Step 2: Create ThemeCard component**

```typescript
// src/client/components/ThemeCard.tsx
import { useTodayTheme } from '@/client/hooks/useTodayTheme'

export function ThemeCard() {
  const { data: theme, isLoading } = useTodayTheme()

  if (isLoading || !theme) return null

  return (
    <div className="theme-card">
      <span className="theme-label">今日のお題</span>
      <span className="theme-text">{theme.themeText}</span>
      {theme.description && (
        <span className="theme-description">{theme.description}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add ThemeCard to Timeline**

In `src/client/components/Timeline.tsx`, add import and render:

Add import:
```typescript
import { ThemeCard } from '@/client/components/ThemeCard'
```

In the JSX, add `<ThemeCard />` right after `<PostForm>`:

```tsx
<div className="timeline">
  <PostForm onSubmit={handlePost} />
  <ThemeCard />
  <div className="season-filter">
```

- [ ] **Step 4: Add CSS for ThemeCard**

Append to `public/styles/vertical.css`:

```css
.theme-card {
  background: var(--color-surface);
  border: 1px solid var(--color-accent);
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-label {
  font-size: 12px;
  color: var(--color-accent);
  font-weight: bold;
}

.theme-text {
  font-family: var(--font-mincho);
  font-size: 18px;
  color: var(--color-text);
}

.theme-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-left: auto;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/client/hooks/useTodayTheme.ts src/client/components/ThemeCard.tsx src/client/components/Timeline.tsx public/styles/vertical.css
git commit -m "feat: add daily theme card to timeline with useTodayTheme hook"
```

---

## Task 6: シェア画像 SVG テンプレートとテスト

**Files:**
- Modify: `src/server/utils/ogp.ts`
- Create: `src/server/utils/share-image.ts`
- Create: `test/server/utils/share-image.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// test/server/utils/share-image.test.ts
import { describe, it, expect } from 'vitest'
import { generateShareSvg } from '@/server/utils/share-image'

describe('generateShareSvg', () => {
  it('generates washi-style SVG', () => {
    const svg = generateShareSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      author: '芭蕉',
      type: 'haiku',
      style: 'washi',
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('古池や')
    expect(svg).toContain('芭蕉')
    expect(svg).toContain('#faf8f5')
  })

  it('generates modern-style SVG', () => {
    const svg = generateShareSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      author: '芭蕉',
      type: 'haiku',
      style: 'modern',
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('#1a1a2e')
    expect(svg).toContain('#e8e0d8')
  })

  it('includes tanka lines when present', () => {
    const svg = generateShareSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入る',
      author: '芭蕉',
      type: 'tanka',
      style: 'washi',
    })
    expect(svg).toContain('静けさや')
    expect(svg).toContain('岩にしみ入る')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/server/utils/share-image.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create share-image.ts**

```typescript
// src/server/utils/share-image.ts
import { escapeXml } from './ogp'

type ShareStyle = 'washi' | 'modern'

interface ShareImageInput {
  line1: string
  line2: string
  line3: string
  line4?: string | null
  line5?: string | null
  author: string
  type: 'haiku' | 'tanka'
  style: ShareStyle
}

function escapeXmlAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const STYLES = {
  washi: {
    bg: '#faf8f5',
    surface: '#ffffff',
    border: '#d4cdc4',
    text: '#1a1a1a',
    accent: '#8b4513',
    label: '#8b4513',
    author: '#666666',
  },
  modern: {
    bg: 'url(#modernGrad)',
    surface: 'transparent',
    border: 'transparent',
    text: '#e8e0d8',
    accent: '#c4956a',
    label: '#c4956a',
    author: '#999999',
  },
}

export function generateShareSvg(input: ShareImageInput): string {
  const lines = [input.line1, input.line2, input.line3]
  if (input.line4) lines.push(input.line4)
  if (input.line5) lines.push(input.line5)

  const s = STYLES[input.style]
  const typeLabel = input.type === 'haiku' ? '俳句' : '短歌'

  const lineElements = lines
    .map((line, i) => {
      const x = 900 - i * 120
      return `<text x="${x}" y="160" font-family="serif" font-size="48" fill="${s.text}" writing-mode="tb" letter-spacing="8">${escapeXmlAttribute(line)}</text>`
    })
    .join('\n')

  const gradientDef = input.style === 'modern'
    ? `<defs><linearGradient id="modernGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient></defs>`
    : ''

  const rect = input.style === 'washi'
    ? `<rect width="1200" height="630" fill="${s.bg}"/>
  <rect x="40" y="40" width="1120" height="550" rx="8" fill="${s.surface}" stroke="${s.border}" stroke-width="1"/>`
    : `<rect width="1200" height="630" fill="${s.bg}"/>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${gradientDef}
  ${rect}
  <text x="100" y="100" font-family="serif" font-size="20" fill="${s.label}">${typeLabel}</text>
  ${lineElements}
  <text x="100" y="540" font-family="serif" font-size="18" fill="${s.author}">${escapeXmlAttribute(input.author)}</text>
  <text x="1000" y="540" font-family="serif" font-size="18" fill="${s.accent}">五七五</text>
</svg>`
}
```

- [ ] **Step 4: Refactor ogp.ts to export escapeXml**

In `src/server/utils/ogp.ts`, rename the internal `escapeXml` to be exported:

```typescript
export function escapeXml(text: string): string {
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/utils/share-image.ts src/server/utils/ogp.ts test/server/utils/share-image.test.ts
git commit -m "feat: add share image SVG generator with washi and modern styles"
```

---

## Task 7: シェア画像 API ルート

**Files:**
- Modify: `src/server/routes/posts.ts`

- [ ] **Step 1: Add share-image endpoint to posts.ts**

Add import at top of `src/server/routes/posts.ts`:

```typescript
import { generateShareSvg } from '@/server/utils/share-image'
```

Add new route before `posts.get('/:id', ...)` (to avoid route conflict):

```typescript
posts.get('/:id/share-image', cacheMiddleware(86400), optionalAuthMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const postId = c.req.param('id')
  const style = c.req.query('style') === 'modern' ? 'modern' : 'washi'

  const row = await queries.getPostById(db, postId)
  if (!row) {
    return c.json({ success: false, error: '投稿が見つかりません' }, 404)
  }

  const svg = generateShareSvg({
    line1: row.post.line1,
    line2: row.post.line2,
    line3: row.post.line3,
    line4: row.post.line4,
    line5: row.post.line5,
    author: row.author.displayName,
    type: row.post.type as 'haiku' | 'tanka',
    style,
  })

  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400',
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/server/routes/posts.ts
git commit -m "feat: add share-image SVG endpoint with washi/modern styles"
```

---

## Task 8: フロントエンド — ShareImageModal とシェアボタン

**Files:**
- Create: `src/client/components/ShareImageModal.tsx`
- Modify: `src/client/components/PostCard.tsx`
- Modify: `src/client/components/PostDetail.tsx`

- [ ] **Step 1: Create ShareImageModal**

```typescript
// src/client/components/ShareImageModal.tsx
import { useState } from 'react'

interface ShareImageModalProps {
  postId: string
  onClose: () => void
}

export function ShareImageModal({ postId, onClose }: ShareImageModalProps) {
  const [style, setStyle] = useState<'washi' | 'modern'>('washi')

  const handleDownload = async () => {
    const url = `/api/posts/${postId}/share-image?style=${style}`
    const link = document.createElement('a')
    link.href = url
    link.download = `575-${postId}-${style}.svg`
    link.click()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>画像でシェア</h2>

        <div className="share-style-options">
          <button
            className={`share-style-btn ${style === 'washi' ? 'active' : ''}`}
            onClick={() => setStyle('washi')}
          >
            <img src={`/api/posts/${postId}/share-image?style=washi`} alt="和紙風" className="share-preview" />
            <span>和紙風</span>
          </button>
          <button
            className={`share-style-btn ${style === 'modern' ? 'active' : ''}`}
            onClick={() => setStyle('modern')}
          >
            <img src={`/api/posts/${postId}/share-image?style=modern`} alt="モダン" className="share-preview" />
            <span>モダン</span>
          </button>
        </div>

        <div className="share-actions">
          <button className="btn-primary" onClick={handleDownload}>ダウンロード</button>
          <button className="btn-cancel" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add share button to PostCard**

In `src/client/components/PostCard.tsx`, add state and import:

```typescript
import { useState } from 'react'
import { ShareImageModal } from '@/client/components/ShareImageModal'
```

Add state inside the component function:

```typescript
const [showShare, setShowShare] = useState(false)
```

Add share button in the `post-meta` div, after the like button:

```tsx
<button
  className="share-button"
  onClick={(e) => { e.stopPropagation(); setShowShare(true) }}
>
  ↗
</button>
{showShare && <ShareImageModal postId={post.id} onClose={() => setShowShare(false)} />}
```

- [ ] **Step 3: Add share button to PostDetail**

In `src/client/components/PostDetail.tsx`, add import and state:

```typescript
import { useState } from 'react'
import { ShareImageModal } from '@/client/components/ShareImageModal'
```

Add inside component:

```typescript
const [showShare, setShowShare] = useState(false)
```

Add share button in `post-meta`, after the like button:

```tsx
<button className="share-button" onClick={() => setShowShare(true)}>
  ↗ 画像でシェア
</button>
{showShare && <ShareImageModal postId={post.id} onClose={() => setShowShare(false)} />}
```

- [ ] **Step 4: Add CSS for modal and share button**

Append to `public/styles/vertical.css`:

```css
.share-button {
  background: none;
  border: 1px solid var(--color-border);
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.share-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
}

.modal-content h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.share-style-options {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.share-style-btn {
  flex: 1;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  text-align: center;
  font-family: var(--font-mincho);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.share-style-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.share-preview {
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-bottom: 4px;
}

.share-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 24px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: var(--font-mincho);
  font-size: 14px;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/client/components/ShareImageModal.tsx src/client/components/PostCard.tsx src/client/components/PostDetail.tsx public/styles/vertical.css
git commit -m "feat: add share image modal with washi/modern style selector"
```

---

## Task 9: ビルド・デプロイ確認

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Run seed script**

Run: `npm run db:seed-themes`
Expected: "Seeding N daily themes... Done!"

- [ ] **Step 4: Final commit and push**

```bash
git push
```
