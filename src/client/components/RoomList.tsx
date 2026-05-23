import { useQuery, useQueryClient } from '@tanstack/react-query'

interface Room {
  id: string
  status: string
  creator: { displayName: string }
  lineCount: number
}

export function RoomList() {
  const queryClient = useQueryClient()
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const json = await res.json() as { success: boolean; data: Room[] }
      return json.data
    },
  })

  const handleCreate = async () => {
    await fetch('/api/rooms', { method: 'POST' })
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
  }

  return (
    <div className="rooms">
      <h2 className="section-title">連句の座</h2>
      <button className="btn-primary" onClick={handleCreate} style={{ marginBottom: 16 }}>
        新しい座を立てる
      </button>
      {isLoading ? (
        <p>読み込み中...</p>
      ) : !rooms || rooms.length === 0 ? (
        <p className="empty-message">アクティブな座はありません</p>
      ) : (
        <div className="rooms-list">
          {rooms.map((room) => (
            <a key={room.id} href={`/rooms/${room.id}`} className="room-card">
              <span className="room-status">{room.status === 'active' ? '進行中' : '終了'}</span>
              <span className="room-creator">{room.creator.displayName}</span>
              <span className="room-lines">{room.lineCount}/5 行</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
