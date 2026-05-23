import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface RoomLine {
  id: string
  lineNumber: number
  line: string
  author: { displayName: string }
}

interface RoomData {
  id: string
  status: string
  lines: RoomLine[]
}

interface RoomDetailProps {
  roomId: string
}

export function RoomDetail({ roomId }: RoomDetailProps) {
  const queryClient = useQueryClient()
  const [lineInput, setLineInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${roomId}`)
      if (!res.ok) throw new Error('Failed to fetch room')
      const json = await res.json() as { success: boolean; data: RoomData }
      return json.data
    },
    refetchInterval: 5000,
  })

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lineInput) return

    setSubmitting(true)
    await fetch(`/api/rooms/${roomId}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: lineInput }),
      credentials: 'same-origin',
    })
    setLineInput('')
    setSubmitting(false)
    queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  }

  if (isLoading) return <p>読み込み中...</p>
  if (!room) return <p>ルームが見つかりません</p>

  const nextLine = room.lines.length + 1
  const pattern = nextLine <= 2 || nextLine === 4 || nextLine === 5 ? '五' : '七'

  return (
    <div className="room-detail">
      <h2 className="section-title">
        連句の座 — {room.status === 'active' ? '進行中' : '終了'}
      </h2>

      <div className="room-lines-display">
        {room.lines.map((l) => (
          <div key={l.id} className="room-line">
            <span className="room-line-number">{l.lineNumber}</span>
            <span className="room-line-text">{l.line}</span>
            <span className="room-line-author">{l.author.displayName}</span>
          </div>
        ))}
      </div>

      {room.status === 'active' && nextLine <= 5 && (
        <form className="room-add-form" onSubmit={handleAddLine}>
          <span className="room-pattern">{nextLine}行目（{pattern}）</span>
          <input
            value={lineInput}
            onChange={(e) => setLineInput(e.target.value)}
            placeholder={`${pattern}文字`}
            maxLength={pattern === '五' ? 8 : 10}
          />
          <button type="submit" className="btn-primary" disabled={submitting || !lineInput}>
            {submitting ? '送信中...' : '追加'}
          </button>
        </form>
      )}

      <a href="/rooms" className="btn-back" style={{ marginTop: 16 }}>座一覧に戻る</a>
    </div>
  )
}
