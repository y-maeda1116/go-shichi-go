import { useState } from 'react'
import { usePosts } from '@/client/hooks/usePosts'
import { PostCard } from '@/client/components/PostCard'
import { TimelineSkeleton } from '@/client/components/Skeleton'

interface UserProfileProps {
  user: {
    id: string
    displayName: string
    bio: string | null
    iconUrl: string | null
  }
  isOwn: boolean
}

export function UserProfile({ user, isOwn }: UserProfileProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams()
  params.set('userId', user.id)

  const posts: {
    id: string
    type: string
    line1: string
    line2: string
    line3: string
    line4: string | null
    line5: string | null
    author: { id: string; displayName: string; iconUrl: string | null }
    likeCount: number
    likedByMe: boolean
    createdAt: Date
  }[] = []

  const handleLike = async (postId: string) => {
    await fetch('/api/posts/' + postId + '/like', { method: 'POST' })
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="user-profile" key={refreshKey}>
      <div className="profile-header">
        {user.iconUrl && (
          <img src={user.iconUrl} alt="" className="profile-icon" />
        )}
        <div className="profile-info">
          <h1 className="profile-display-name">{user.displayName}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
        </div>
        {isOwn && (
          <a href="/profile/edit" className="btn-edit">編集</a>
        )}
      </div>
      <h2 className="section-title">投稿一覧</h2>
      <div className="timeline-posts">
        {posts.length === 0 && (
          <p className="empty-message">まだ投稿がありません</p>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post as any} onLike={handleLike} />
        ))}
      </div>
    </div>
  )
}
