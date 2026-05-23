import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePosts } from '@/client/hooks/usePosts'
import { PostCard } from '@/client/components/PostCard'
import type { ReactionType } from '@/types'
import { PostForm } from '@/client/components/PostForm'
import { TimelineSkeleton } from '@/client/components/Skeleton'
import { ThemeCard } from '@/client/components/ThemeCard'

const SEASONS = [
  { value: '', label: 'すべて' },
  { value: '春', label: '春' },
  { value: '夏', label: '夏' },
  { value: '秋', label: '秋' },
  { value: '冬', label: '冬' },
  { value: '新年', label: '新年' },
]

export function Timeline() {
  const [season, setSeason] = useState('')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts(season || undefined)
  const queryClient = useQueryClient()

  const posts = data?.pages.flatMap((page) => page.data) ?? []

  const handleReact = async (postId: string, reactionType: ReactionType) => {
    await fetch('/api/posts/' + postId + '/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionType }),
    })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
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
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  return (
    <div className="timeline">
      <PostForm onSubmit={handlePost} />
      <ThemeCard />
      <div className="season-filter">
        {SEASONS.map((s) => (
          <button
            key={s.value}
            className={`season-button ${season === s.value ? 'active' : ''}`}
            onClick={() => setSeason(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <TimelineSkeleton />
      ) : (
        <div className="timeline-posts">
          {posts.length === 0 && (
            <p className="empty-message">投稿がありません</p>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onReact={handleReact} />
          ))}
        </div>
      )}
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
