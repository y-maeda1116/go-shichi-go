# コミュニケーション & モチベーション機能 設計

## Context
既存の likes システムを拡張してリアクション風流化し、返句・継続バッジ・ランキング・連句ルームを追加する。

## 機能1: リアクション風流化

### データモデル
`likes` テーブルに `reaction_type` カラムを追加：

```sql
ALTER TABLE likes ADD COLUMN reaction_type TEXT NOT NULL DEFAULT 'heart';
```

リアクション種別:
- `heart` — ♡（デフォルト、既存互換）
- `aware` — あはれ
- `okashi` — をかし
- `zabuton` — 座布団
- `clap` — 拍手

### API
- `POST /api/posts/:id/react` — body: `{ reactionType: string }` — toggle（既存なら削除、なければ作成）
- 既存 `POST /api/posts/:id/like` は `reactionType: 'heart'` として動作（後方互換）

### フロントエンド
- PostCard/PostDetail の♡ボタンを5つのリアクションボタンに変更
- 各リアクションの件数を `reactions: { heart: 3, aware: 1, ... }` で表示

## 機能2: 返句機能

### データモデル
`replies` テーブル追加:

```sql
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  line1 TEXT NOT NULL,
  line2 TEXT NOT NULL,
  line3 TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

返句は俳句形式（五七五）のみ。短歌返句はなし。

### API
- `GET /api/posts/:id/replies` — 返句一覧
- `POST /api/posts/:id/replies` — 返句作成（要認証）
- `DELETE /api/replies/:id` — 返句削除（本人のみ）

### フロントエンド
- PostDetail に「返句する」フォーム（line1/line2/line3 入力）
- 返句一覧を投稿の下に縦書き表示

## 機能3: 継続バッジ

### アプローチ
新テーブル不要。`posts` テーブルから連続投稿日数をリアルタイム計算。

### API
- `GET /api/users/:id/streak` — `{ currentStreak: number, maxStreak: number, lastPostDate: string }`

### フロントエンド
- UserProfile にバッジ表示:
  - 7日連続: 初心者バッジ 🌱
  - 30日連続: 皆伝バッジ 🏅
  - 100日連続: 名人バッジ 🎯

## 機能4: 秀句ランキング

### API
- `GET /api/rankings?period=weekly|monthly` — 期間内リアクション数上位10投稿

### フロントエンド
- /rankings ページ追加
- 週間・月間タブ切り替え
- 各投稿へのリンク付き

## 機能5: 連句ルーム

### データモデル
`linked_verse_rooms` と `linked_verse_lines` テーブル追加:

```sql
CREATE TABLE linked_verse_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE linked_verse_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES linked_verse_rooms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  line TEXT NOT NULL,
  line_number INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### API
- `POST /api/rooms` — ルーム作成
- `GET /api/rooms` — アクティブルーム一覧
- `GET /api/rooms/:id` — ルーム詳細（lines 含む）
- `POST /api/rooms/:id/lines` — 行追加（5-7-5-7-7 の順、1行ずつ）
- `POST /api/rooms/:id/close` — ルーム終了

### フロントエンド
- /rooms ページ — アクティブルーム一覧
- /rooms/:id ページ — リアルタイム風（ポーリング5秒）で行が追加される様子を表示
- 「次の句を追加」フォーム

## ファイル変更一覧

### 新規ファイル
- `src/server/db/replies-schema.ts` — replies テーブル
- `src/server/db/rooms-schema.ts` — 連句ルームテーブル
- `src/server/routes/replies.ts` — 返句 API
- `src/server/routes/rankings.ts` — ランキング API
- `src/server/routes/rooms.ts` — 連句ルーム API
- `src/client/components/ReactionButtons.tsx` — リアクションボタン
- `src/client/components/ReplyForm.tsx` — 返句フォーム
- `src/client/components/ReplyList.tsx` — 返句一覧
- `src/client/components/StreakBadge.tsx` — 継続バッジ
- `src/client/components/Rankings.tsx` — ランキングページ
- `src/client/components/RoomList.tsx` — ルーム一覧
- `src/client/components/RoomDetail.tsx` — ルーム詳細
- `src/client/hooks/useStreak.ts` — ストリーク取得

### 変更ファイル
- `src/server/db/schema.ts` — likes に reaction_type 追加
- `src/server/db/queries.ts` — リアクション・返句・ルームクエリ追加
- `src/server/routes/posts.ts` — リアクション API 追加
- `src/app.ts` — 新ルート登録
- `src/types.ts` — ReactionType, Reply, Room 型追加
- `src/client/components/PostCard.tsx` — リアクションボタンに変更
- `src/client/components/PostDetail.tsx` — リアクション + 返句表示
- `src/client/components/UserProfile.tsx` — バッジ表示
- `src/client/entry.tsx` — 新ページ hydration 追加
- `src/server/routes/pages.tsx` — 新ページ SSR 追加
- `public/styles/vertical.css` — 新コンポーネント CSS
