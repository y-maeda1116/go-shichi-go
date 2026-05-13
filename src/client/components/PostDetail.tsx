import type { PostWithAuthor } from '@/types'
import { PostCard } from '@/client/components/PostCard'

interface PostDetailProps {
  post: PostWithAuthor
}

export function PostDetail({ post }: PostDetailProps) {
  const lines = [post.line1, post.line2, post.line3]
  if (post.line4) lines.push(post.line4)
  if (post.line5) lines.push(post.line5)

  const handleLike = async () => {
    await fetch('/api/posts/' + post.id + '/like', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="post-detail">
      <div className="post-detail-main">
        <article className="post-card post-card-large">
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
          {post.authorNote && (
            <p className="author-note">{post.authorNote}</p>
          )}
          <div className="post-meta">
            <time>{post.createdAt.toLocaleDateString('ja-JP')}</time>
            <button
              className={`like-button ${post.likedByMe ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {post.likedByMe ? '♥' : '♡'} {post.likeCount}
            </button>
          </div>
        </article>
      </div>
      <div className="post-detail-sidebar">
        <div className="author-card">
          {post.author.iconUrl && (
            <img src={post.author.iconUrl} alt="" className="author-icon" />
          )}
          <a href={`/users/${post.author.id}`} className="author-name">
            {post.author.displayName}
          </a>
        </div>
        <a href="/" className="btn-back">タイムラインに戻る</a>
      </div>
    </div>
  )
}
