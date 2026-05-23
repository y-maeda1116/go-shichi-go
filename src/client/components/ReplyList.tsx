import { useQuery } from '@tanstack/react-query'
import type { Reply } from '@/types'

interface ReplyListProps {
  postId: string
}

export function ReplyList({ postId }: ReplyListProps) {
  const { data: replies, isLoading } = useQuery({
    queryKey: ['replies', postId],
    queryFn: async () => {
      const res = await fetch(`/api/replies/${postId}/replies`)
      if (!res.ok) throw new Error('Failed to fetch replies')
      const json = await res.json() as { success: boolean; data: Reply[] }
      return json.data
    },
  })

  if (isLoading || !replies || replies.length === 0) return null

  return (
    <div className="reply-list">
      <h3 className="section-title">返句</h3>
      {replies.map((reply) => (
        <div key={reply.id} className="reply-card">
          <div className="post-card-lines">
            <span className="post-line">{reply.line1}</span>
            <span className="post-line">{reply.line2}</span>
            <span className="post-line">{reply.line3}</span>
            <span className="post-author">{reply.author.displayName}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
