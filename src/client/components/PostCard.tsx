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
    <article className="post-card" onClick={() => window.location.href = `/posts/${post.id}`} style={{ cursor: 'pointer' }}>
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
