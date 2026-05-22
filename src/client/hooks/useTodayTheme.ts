import { useQuery } from '@tanstack/react-query'

interface TodayTheme {
  date: string
  themeText: string
  description: string | null
}

export function useTodayTheme() {
  return useQuery({
    queryKey: ['theme', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/themes/today')
      if (!res.ok) throw new Error('お題の取得に失敗しました')
      const json = await res.json() as { success: boolean; data: TodayTheme | null }
      return json.data
    },
    staleTime: 300000,
  })
}
