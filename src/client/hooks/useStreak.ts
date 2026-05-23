import { useQuery } from '@tanstack/react-query'

export function useStreak(userId: string | undefined) {
  return useQuery({
    queryKey: ['streak', userId],
    queryFn: async () => {
      if (!userId) return { currentStreak: 0, maxStreak: 0 }
      const res = await fetch(`/api/rankings/streak/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch streak')
      const json = await res.json() as { success: boolean; data: { currentStreak: number; maxStreak: number } }
      return json.data
    },
    enabled: !!userId,
  })
}
