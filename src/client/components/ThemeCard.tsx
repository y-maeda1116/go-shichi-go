import { useTodayTheme } from '@/client/hooks/useTodayTheme'

export function ThemeCard() {
  const { data: theme, isLoading } = useTodayTheme()

  if (isLoading || !theme) return null

  return (
    <div className="theme-card">
      <span className="theme-label">今日のお題</span>
      <span className="theme-text">{theme.themeText}</span>
      {theme.description && (
        <span className="theme-description">{theme.description}</span>
      )}
    </div>
  )
}
