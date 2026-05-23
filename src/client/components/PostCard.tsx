import { useState } from 'react'
import { ShareImageModal } from '@/client/components/ShareImageModal'
import { ReactionButtons } from '@/client/components/ReactionButtons'
import type { PostWithAuthor, ReactionType } from '@/types'

function extractHashtags(text: string): string[] {
  const matches = text.match(/#([^\s#]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(1)))]
}

interface PostCardProps {
  post: PostWithAuthor
  onReact: (postId: string, type: ReactionType) => void
}

export function PostCard({ post, onReact }: PostCardProps) {
  const [showShare, setShowShare] = useState(false)
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
      {post.authorNote && extractHashtags(post.authorNote).length > 0 && (
        <div className="hashtag-list">
          {extractHashtags(post.authorNote).map((tag) => (
            <a key={tag} href={`/?season=&tag=${tag}`} className="hashtag">#{tag}</a>
          ))}
        </div>
      )}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="post-image" />
      )}
      <div className="post-meta">
        <time>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</time>
        <ReactionButtons
          reactions={post.reactions ?? {}}
          myReaction={post.myReaction ?? null}
          onReact={(type) => onReact(post.id, type)}
        />
        <button
          className="share-button"
          onClick={(e) => { e.stopPropagation(); setShowShare(true) }}
        >
          ↗
        </button>
        {showShare && <ShareImageModal postId={post.id} onClose={() => setShowShare(false)} />}
      </div>
    </article>
  )
}
