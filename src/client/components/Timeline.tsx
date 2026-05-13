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
