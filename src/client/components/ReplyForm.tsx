import { useState } from 'react'

interface ReplyFormProps {
  postId: string
  onSubmitted: () => void
}

export function ReplyForm({ postId, onSubmitted }: ReplyFormProps) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState({ line1: '', line2: '', line3: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lines.line1 || !lines.line2 || !lines.line3) return

    setSubmitting(true)
    await fetch(`/api/replies/${postId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lines),
      credentials: 'same-origin',
    })
    setLines({ line1: '', line2: '', line3: '' })
    setSubmitting(false)
    setOpen(false)
    onSubmitted()
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} style={{ marginTop: 12 }}>
        返句する
      </button>
    )
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <div className="post-line-input">
        <input
          value={lines.line1}
          onChange={(e) => setLines({ ...lines, line1: e.target.value })}
          placeholder="上の句（五）"
          maxLength={20}
        />
        <span className="char-count">{lines.line1.length}</span>
      </div>
      <div className="post-line-input">
        <input
          value={lines.line2}
          onChange={(e) => setLines({ ...lines, line2: e.target.value })}
          placeholder="中の句（七）"
          maxLength={20}
        />
        <span className="char-count">{lines.line2.length}</span>
      </div>
      <div className="post-line-input">
        <input
          value={lines.line3}
          onChange={(e) => setLines({ ...lines, line3: e.target.value })}
          placeholder="下の句（五）"
          maxLength={20}
        />
        <span className="char-count">{lines.line3.length}</span>
      </div>
      <div className="post-form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '送信中...' : '返句'}
        </button>
        <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>
          やめる
        </button>
      </div>
    </form>
  )
}
