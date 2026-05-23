import { REACTION_LABELS, type ReactionType } from '@/types'

const REACTION_TYPES: ReactionType[] = ['heart', 'aware', 'okashi', 'zabuton', 'clap']

interface ReactionButtonsProps {
  reactions: Partial<Record<ReactionType, number>>
  myReaction: ReactionType | null
  onReact: (type: ReactionType) => void
}

export function ReactionButtons({ reactions, myReaction, onReact }: ReactionButtonsProps) {
  return (
    <div className="reaction-buttons">
      {REACTION_TYPES.map((type) => (
        <button
          key={type}
          className={`reaction-btn ${myReaction === type ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onReact(type) }}
        >
          {REACTION_LABELS[type]}
          {reactions[type] ? ` ${reactions[type]}` : ''}
        </button>
      ))}
    </div>
  )
}
