# 日替わりお題 & シェア画像生成機能

## Context
「何を書けばいいか分からない」を解決する日替わりお題機能と、投稿をSNSシェア用画像にする機能を追加する。アプリの使いやすさと外部への認知拡大の両方を狙う。

## 機能1: 日替わりお題

### データモデル

`daily_themes` テーブルを追加:

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | 自動生成 |
| date | date (unique) | 対象日 |
| themeText | text | お題テキスト（例: #五月晴れ、猫） |
| description | text | 補足説明（任意） |
| createdAt | timestamp | 作成日時 |

### API

- `GET /api/themes/today` — 当日のお題を返す
- `GET /api/themes/:date` — 指定日のお題を返す（任意）
- レスポンス: `{ success: true, data: { date, themeText, description } }`

### フロントエンド

- タイムライン上部に「今日のお題」カードを表示
- `useTodayTheme` フックで当日のお題を取得
- お題テキストをクリックすると、そのお題に関連する投稿（seasonWord または本文にマッチ）をフィルタ表示

### シードスクリプト

- `scripts/seed-themes.ts` で365日分の季語・テーマを一括登録
- 季節に合わせた季語を配置（春: 桜・霞、夏: 蝉・入道雲、秋: 紅葉・月、冬: 雪・椿 など）
- `npm run db:seed-themes` で実行

### テーブル設計

```sql
CREATE TABLE daily_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  theme_text TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 機能2: シェア画像生成

### アプローチ

既存の `generateOgSvg` をベースに2つのスタイルテンプレートを追加。SVG を生成し Cloudflare Browser Rendering で PNG に変換。

### API

- `GET /api/posts/:id/share-image?style=washi` — 和紙風画像を返す
- `GET /api/posts/:id/share-image?style=modern` — モダン画像を返す
- Content-Type: `image/png`
- キャッシュ: `Cache-Control: public, max-age=86400`（1日）

### 画像テンプレート

**A. 和紙風 (washi)**
- 背景: #faf8f5（和紙色）
- 枠: 白枠に淡いボーダー
- 文字: 縦書き、明朝体、#1a1a1a
- アクセント: #8b4513
- 既存の OGP 画像をベースに解像度アップ

**B. モダン (modern)**
- 背景: #1a1a2e → #16213e グラデーション
- 文字: 縦書き、明朝体、#e8e0d8
- アクセント: #c4956a（金色）
- 1200x630px

### フロントエンド

- PostCard / PostDetail に「画像でシェア」ボタンを追加
- クリックでモーダル表示:
  1. スタイル選択（和紙風 / モダン）のプレビュー
  2. 「ダウンロード」ボタンで画像保存
- 画像URLは `/api/posts/:id/share-image?style=washi|modern`

### Cloudflare 設定

- `wrangler.toml` に Browser Rendering binding を追加
- Browser Rendering が使えない環境（ローカル開発等）では SVG をそのまま配信（フォールバック）
- ブラウザで SVG を Canvas に描画して PNG ダウンロードも検討（追加コストなし）

## ファイル変更一覧

### 新規ファイル
- `src/server/db/themes-schema.ts` — daily_themes テーブル定義
- `drizzle/migrations/XXXX_add_daily_themes.sql` — マイグレーション
- `scripts/seed-themes.ts` — お題データシードスクリプト
- `src/server/routes/themes.ts` — お題 API ルート
- `src/server/utils/share-image.ts` — 画像生成ユーティリティ
- `src/client/components/ThemeCard.tsx` — お題表示カード
- `src/client/components/ShareImageModal.tsx` — シェア画像モーダル
- `src/client/hooks/useTodayTheme.ts` — お題取得フック

### 変更ファイル
- `src/server/db/queries.ts` — daily_themes クエリ追加
- `src/server/routes/pages.tsx` — タイムラインページにお題渡し
- `src/client/entry.tsx` — hydration 対象の確認（不要なら変更なし）
- `src/client/components/Timeline.tsx` — ThemeCard 表示
- `src/client/components/PostCard.tsx` — シェアボタン追加
- `src/client/components/PostDetail.tsx` — シェアボタン追加
- `src/app.ts` — themes ルート登録
- `wrangler.toml` — Browser Rendering binding（必要な場合）
- `package.json` — シードスクリプト追加

## 検証方法

1. `npm run db:generate && npm run db:migrate` でテーブル作成
2. `npm run db:seed-themes` でお題データ登録
3. トップページで「今日のお題」が表示される
4. 投稿詳細で「画像でシェア」ボタンから和紙風/モダン画像をダウンロード
5. 生成画像が1200x630で正しく表示される
6. `npm test` で全テスト合格
