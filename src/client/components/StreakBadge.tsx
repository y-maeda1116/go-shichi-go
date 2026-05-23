interface StreakBadgeProps {
  currentStreak: number
  maxStreak: number
}

export function StreakBadge({ currentStreak, maxStreak }: StreakBadgeProps) {
  let badge = ''
  let label = ''
  if (maxStreak >= 100) {
    badge = '🎯'
    label = '名人'
  } else if (maxStreak >= 30) {
    badge = '🏅'
    label = '皆伝'
  } else if (maxStreak >= 7) {
    badge = '🌱'
    label = '初心者'
  }

  return (
    <div className="streak-badge">
      {currentStreak > 0 && (
        <span className="streak-current">{currentStreak}日連続</span>
      )}
      {badge && (
        <span className="streak-rank" title={`最高${maxStreak}日連続`}>
          {badge} {label}
        </span>
      )}
    </div>
  )
}
