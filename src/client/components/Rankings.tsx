import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface RankedPost {
  id: string
  line1: string
  line2: string
  line3: string
  likeCount: number
  author: { displayName: string }
}

export function Rankings() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const { data: posts, isLoading } = useQuery({
    queryKey: ['rankings', period],
    queryFn: async () => {
      const res = await fetch(`/api/rankings/${period}`)
      if (!res.ok) throw new Error('Failed to fetch rankings')
      const json = await res.json() as { success: boolean; data: RankedPost[] }
      return json.data
    },
  })

  return (
    <div className="rankings">
      <h2 className="section-title">秀句ランキング</h2>
      <div className="season-filter">
        <button
          className={`season-button ${period === 'weekly' ? 'active' : ''}`}
          onClick={() => setPeriod('weekly')}
        >
          週間
        </button>
        <button
          className={`season-button ${period === 'monthly' ? 'active' : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          月間
        </button>
      </div>
      {isLoading ? (
        <p>読み込み中...</p>
      ) : !posts || posts.length === 0 ? (
        <p className="empty-message">まだ投稿がありません</p>
      ) : (
        <div className="rankings-list">
          {posts.map((post, i) => (
            <a key={post.id} href={`/posts/${post.id}`} className="ranking-item">
              <span className="ranking-rank">{i + 1}</span>
              <span className="ranking-lines">
                {post.line1}{post.line2}{post.line3}
              </span>
              <span className="ranking-author">{post.author.displayName}</span>
              <span className="ranking-likes">{post.likeCount}♡</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
